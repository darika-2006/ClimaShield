const db = require('../config/db');

/**
 * Emergency hotline constants for Tamil Nadu TNSDMA
 */
const EMERGENCY_HOTLINES = {
  stateControlRoom: '1070',
  districtControlRoom: '1077',
  ambulance: '108',
  fireAndRescue: '101',
  police: '100',
  womenHelpline: '181',
};

/**
 * POST /api/v1/chat/message
 * Real AI Emergency Assistant ("TN Meenatchi AI") with Context Injection & LLM Inference Fallback
 */
async function handleChatMessage(req, res, next) {
  try {
    const { message, district, userLocation, language = 'en' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message string is required.',
      });
    }

    // 1. Fetch Geodesic Nearest Shelter for Grounding Context
    let nearestShelter = null;
    let targetLat = userLocation?.lat ? parseFloat(userLocation.lat) : 13.0827;
    let targetLon = userLocation?.lon ? parseFloat(userLocation.lon) : 80.2707;
    let targetDistrict = district || userLocation?.district || 'Chennai';

    try {
      const shelterRes = await db.query(
        `SELECT name, district_name, address, capacity, current_occupancy, contact_phone,
                (ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) / 1000.0)::numeric(10,2) AS distance_km
         FROM shelters
         ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
         LIMIT 1;`,
        [targetLon, targetLat]
      );
      if (shelterRes.rows.length > 0) {
        nearestShelter = shelterRes.rows[0];
      }
    } catch (err) {
      console.warn('Chatbot shelter PostGIS grounding query error:', err.message);
    }

    const groundingTelemetry = {
      district: targetDistrict,
      coords: `${targetLat.toFixed(4)}° N, ${targetLon.toFixed(4)}° E`,
      shelter: nearestShelter ? `${nearestShelter.name} (${nearestShelter.distance_km} km away)` : 'Statewide Relief Hubs',
    };

    // 2. Attempt Real LLM Inference if API key is provided
    let aiReply = null;
    let modelUsed = 'rule-engine-fallback';

    const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are 'TN Meenatchi AI', the official Emergency Disaster Response Assistant for the Tamil Nadu State Disaster Management Authority (TNSDMA).
Current Context:
- User Detected Location: ${targetDistrict} (${targetLat.toFixed(4)}, ${targetLon.toFixed(4)})
- Nearest Verified Shelter: ${nearestShelter ? `${nearestShelter.name} (${nearestShelter.distance_km} km away, ${nearestShelter.capacity - nearestShelter.current_occupancy} available beds)` : "Statewide Relief Centers"}
- Official Helplines: State Control (1070), District Emergency (1077), Medical Ambulance (108).

Guidelines:
1. Provide immediate, calm, and actionable life-safety advice for disaster, flood, cyclone, heatwave, or shelter queries.
2. If user writes in Tamil, respond in clear Tamil; otherwise, respond in concise English.
3. Include relevant helplines (1070 / 1077 / 108). Zero emojis (use clean markdown text tags like [ALERT], [SAFETY]).
4. Never invent non-existent safe zones; cite only verified nearest shelter telemetry.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        let payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350,
          },
        };

        const apiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          const candidateText = apiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            aiReply = candidateText.trim();
            modelUsed = 'gemini-1.5-flash';
          }
        }
      } catch (err) {
        console.warn('LLM API Inference timed out or failed, utilizing rule engine fallback:', err.message);
      }
    }

    // 3. Fallback Deterministic Rule Engine
    if (!aiReply) {
      const queryLower = message.toLowerCase();

      if (queryLower.includes('flood') || queryLower.includes('water') || queryLower.includes('rain') || queryLower.includes('வெள்ளம்') || queryLower.includes('மழை')) {
        aiReply = language === 'ta'
          ? `[ALERT] வெள்ள எச்சரிக்கை வழிகாட்டுதல் (${targetDistrict}):
1. உடனே மேடான பகுதி அல்லது அருகிலுள்ள நிவாரண முகாமிற்கு செல்லவும்.
2. மின்சார சாதனங்களை அணைக்கவும்.
3. அவசர உதவிக்கு 1070 (மாநிலக் கட்டுப்பாடு) அல்லது 1077 (மாவட்டக் கட்டுப்பாடு) அழைப்பு விடுக்கவும்.`
          : `[ALERT] Flood & Severe Rainfall Safety Protocol (${targetDistrict}):
1. Move immediately to higher ground or nearest safe relief shelter.
2. Turn off main power switches and avoid touching submerged cables.
3. Drink only boiled water to prevent waterborne infections.
4. For emergency rescue, dial 1070 (State Control) or 1077 (District Control).`;
      } else if (queryLower.includes('heat') || queryLower.includes('sun') || queryLower.includes('temperature') || queryLower.includes('வெப்பம்') || queryLower.includes('சூடு')) {
        aiReply = language === 'ta'
          ? `[SAFETY] வெப்ப அலை பாதுகாப்பு:
1. மதியம் 12 முதல் 3 மணி வரை நேரடியாக வெயிலில் செல்வதை தவிர்க்கவும்.
2. போதுமான அளவு நீர் பருகவும். மயக்கம் ஏற்பட்டால் 108 ஆம்புலன்ஸை அழைக்கவும்.`
          : `[SAFETY] Extreme Heatwave Protocol:
1. Avoid direct sun exposure between 12:00 PM and 3:00 PM.
2. Stay hydrated with water and ORS solutions.
3. If experiencing dizziness or heat stroke, dial 108 for medical trauma transport.`;
      } else if (queryLower.includes('shelter') || queryLower.includes('camp') || queryLower.includes('தங்கும்') || queryLower.includes('பாதுகாப்பு')) {
        aiReply = nearestShelter
          ? `[SHELTER INFO] Nearest Designated Safe Relief Shelter:\n• ${nearestShelter.name} (${nearestShelter.address}): ${nearestShelter.capacity - nearestShelter.current_occupancy} available beds (${nearestShelter.distance_km} km away). Helpline: ${nearestShelter.contact_phone || '1077'}.`
          : `[SHELTER INFO] Please contact District Emergency Cell at 1077 for nearest designated evacuation hub.`;
      } else {
        aiReply = language === 'ta'
          ? `[INFO] வணக்கம்! நான் TN மீனாட்சி AI - TNSDMA பேரிடர் மேலாண்மை உதவி மையம்.
அவசர உதவி எண்கள்: 1070 (மாநிலம்), 1077 (மாவட்டம்), 108 (ஆம்புலன்ஸ்).`
          : `[INFO] Greetings! I am TN Meenatchi AI — your TNSDMA Emergency Response Advisor.
Emergency Directives: Dial 1070 (State Control Room), 1077 (District Control Room), or 108 (Medical Emergency).`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        agent: 'TN Meenatchi AI',
        model: modelUsed,
        reply: aiReply,
        groundingTelemetry,
        emergencyNumbers: EMERGENCY_HOTLINES,
        suggestedActions: ['Nearest Shelters', 'Flood Protocol', 'Emergency Hotlines'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleChatMessage,
};
