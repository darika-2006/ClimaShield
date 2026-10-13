import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_report():
    print("🚀 Building ClimaShield TN 38-Page Project Report...")
    doc = docx.Document()

    # 1. Page Geometry & Default Styles
    sec1 = doc.sections[0]
    sec1.top_margin = Inches(1.0)
    sec1.bottom_margin = Inches(1.0)
    sec1.left_margin = Inches(1.0)
    sec1.right_margin = Inches(1.0)
    sec1.page_width = Inches(8.27)  # A4
    sec1.page_height = Inches(11.69)

    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(6)

    # ---------------------------------------------------------------------------
    # Helper Functions
    # ---------------------------------------------------------------------------
    def add_para(text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6, bold=False, italic=False, size=12, indent=True, line_spacing=1.15):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if indent and align == WD_ALIGN_PARAGRAPH.JUSTIFY:
            p.paragraph_format.first_line_indent = Inches(0.5)
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(size)
        return p

    def add_chapter_header(ch_num, ch_title, space_before=12, space_after=12):
        p1 = doc.add_paragraph()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_before = Pt(space_before)
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(f"CHAPTER {ch_num}")
        r1.bold = True
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(16)

        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(space_after)
        r2 = p2.add_run(ch_title.upper())
        r2.bold = True
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(16)

    def add_sec_header(sec_title, space_before=8, space_after=4):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        r = p.add_run(sec_title)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        return p

    def add_subsec_header(subsec_title, space_before=6, space_after=3):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        r = p.add_run(subsec_title)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        return p

    def add_bullet(text, bold_prefix="", space_before=1, space_after=2, size=11, line_spacing=1.1):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        p.paragraph_format.left_indent = Inches(0.5)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = 'Times New Roman'
            r_pre.font.size = Pt(size)
        r_txt = p.add_run(text)
        r_txt.font.name = 'Times New Roman'
        r_txt.font.size = Pt(size)
        return p

    def add_figure(img_path, fig_caption, width=Inches(5.4), space_before=4, space_after=8):
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(space_before)
            p_img.paragraph_format.space_after = Pt(2)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=width)
        else:
            add_para(f"[Image Missing: {img_path}]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(space_after)
        r_cap = p_cap.add_run(fig_caption)
        r_cap.bold = True
        r_cap.font.name = 'Times New Roman'
        r_cap.font.size = Pt(10)

    def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_cell_shading(cell, color="F0F0F0"):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def create_table(headers, data, col_widths=None, font_size=9, header_size=9.5, space_after_table=4):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="D0D0D0"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(tblBorders)

        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.bold = True
                r.font.name = 'Times New Roman'
                r.font.size = Pt(header_size)
            set_cell_shading(hdr_cells[i], "EAEAEA")
            set_cell_margins(hdr_cells[i])

        for r_idx, row_data in enumerate(data):
            row_cells = table.rows[r_idx + 1].cells
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx not in [0, 2, 3] else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(1.5)
                p.paragraph_format.space_after = Pt(1.5)
                for r in p.runs:
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(font_size)
                set_cell_margins(row_cells[c_idx])

        if col_widths:
            for row in table.rows:
                for idx, w in enumerate(col_widths):
                    row.cells[idx].width = w

        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(0)
        p_sp.paragraph_format.space_after = Pt(space_after_table)
        return table

    # ---------------------------------------------------------------------------
    # PAGE 1: TITLE / COVER PAGE
    # ---------------------------------------------------------------------------
    print("Writing Page 1: Title / Cover Page...")
    add_para("CLIMASHIELD TN - TAMIL NADU CLIMATE & DISASTER RISK MONITORING AND RESILIENCE PLATFORM", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=18, bold=True, size=16, indent=False)

    add_para("23IT53C – MODERN WEB TECHNOLOGIES", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18, bold=True, size=13, indent=False)

    add_para("PROJECT REPORT", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=24, bold=True, size=14, indent=False)

    add_para("Submitted by", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=12, italic=True, size=12, indent=False)

    p_stu = doc.add_paragraph()
    p_stu.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_stu.paragraph_format.space_before = Pt(6)
    p_stu.paragraph_format.space_after = Pt(24)
    r_name = p_stu.add_run("DARIKA S                              24205001")
    r_name.bold = True
    r_name.font.name = 'Times New Roman'
    r_name.font.size = Pt(13)

    add_para("In partial fulfillment for the award of the degree\nof\nBACHELOR OF TECHNOLOGY\nin\nINFORMATION TECHNOLOGY", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=24, size=12, indent=False)

    if os.path.exists('assets_report/nec_logo.png'):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(18)
        p_logo.add_run().add_picture('assets_report/nec_logo.png', width=Inches(1.3))

    add_para("NATIONAL ENGINEERING COLLEGE\n(An Autonomous Institution affiliated to Anna University, Chennai)\nK.R.NAGAR, KOVILPATTI - 628503\n\nOCTOBER 2026", 
             align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=0, bold=True, size=12, indent=False)

    # ---------------------------------------------------------------------------
    # SECTION 2: BODY (BONAFIDE CERTIFICATE ONWARDS)
    # ---------------------------------------------------------------------------
    sec2 = doc.add_section(WD_SECTION_START.NEW_PAGE)
    sec2.top_margin = Inches(1.0)
    sec2.bottom_margin = Inches(1.0)
    sec2.left_margin = Inches(1.0)
    sec2.right_margin = Inches(1.0)
    sec2.page_width = Inches(8.27)
    sec2.page_height = Inches(11.69)
    sec2.footer.is_linked_to_previous = False

    pgNumType = OxmlElement('w:pgNumType')
    pgNumType.set(qn('w:start'), '1')
    sec2._sectPr.append(pgNumType)

    footer_p = sec2.footer.paragraphs[0]
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_pg = footer_p.add_run()
    run_pg.font.name = 'Times New Roman'
    run_pg.font.size = Pt(10)

    fld1 = OxmlElement('w:fldChar')
    fld1.set(qn('w:fldCharType'), 'begin')
    fld2 = OxmlElement('w:instrText')
    fld2.set(qn('xml:space'), 'preserve')
    fld2.text = 'PAGE'
    fld3 = OxmlElement('w:fldChar')
    fld3.set(qn('w:fldCharType'), 'separate')
    fld4 = OxmlElement('w:fldChar')
    fld4.set(qn('w:fldCharType'), 'end')
    run_pg._r.append(fld1)
    run_pg._r.append(fld2)
    run_pg._r.append(fld3)
    run_pg._r.append(fld4)

    # ---------------------------------------------------------------------------
    # PAGE 2: BONAFIDE CERTIFICATE (Footer = 1)
    # ---------------------------------------------------------------------------
    print("Writing Page 2: Bonafide Certificate...")
    add_para("NATIONAL ENGINEERING COLLEGE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4, bold=True, size=14, indent=False)
    add_para("(An Autonomous Institution affiliated to Anna University, Chennai)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, size=11, indent=False)
    add_para("K.R.NAGAR, KOVILPATTI - 628503", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18, bold=True, size=12, indent=False)

    if os.path.exists('assets_report/nec_logo.png'):
        p_logo2 = doc.add_paragraph()
        p_logo2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo2.paragraph_format.space_before = Pt(6)
        p_logo2.paragraph_format.space_after = Pt(18)
        p_logo2.add_run().add_picture('assets_report/nec_logo.png', width=Inches(1.1))

    add_para("BONAFIDE CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=24, bold=True, size=14, indent=False)

    add_para(
        "This is to certify that this project report, “CLIMASHIELD TN - TAMIL NADU CLIMATE & DISASTER RISK "
        "MONITORING AND RESILIENCE PLATFORM”, is the bonafide work of DARIKA S (24205001) who carried out the "
        "project work under my supervision in partial fulfillment of the requirements for the award of the degree of "
        "Bachelor of Technology in Information Technology.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=12, space_after=48, size=12, indent=True
    )

    p_sig1 = doc.add_paragraph()
    p_sig1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig1.paragraph_format.space_before = Pt(24)
    p_sig1.paragraph_format.space_after = Pt(48)
    r_sig1 = p_sig1.add_run("Course Instructor              ")
    r_sig1.bold = True
    r_sig1.font.name = 'Times New Roman'
    r_sig1.font.size = Pt(12)

    add_para("Submitted to the 23IT53C – MODERN WEB TECHNOLOGIES Viva-Voce examination held at National Engineering College, K.R.Nagar, Kovilpatti on ___________________.",
             align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=24, space_after=48, size=11, indent=False)

    p_sig2 = doc.add_paragraph()
    p_sig2.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_sig2.paragraph_format.space_before = Pt(24)
    p_sig2.paragraph_format.space_after = Pt(12)
    r_in = p_sig2.add_run("Internal Examiner                                                                                  Co Examiner")
    r_in.bold = True
    r_in.font.name = 'Times New Roman'
    r_in.font.size = Pt(12)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 3: TABLE OF CONTENTS (Footer = 2)
    # ---------------------------------------------------------------------------
    print("Writing Page 3: Table of Contents...")
    add_para("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18, bold=True, size=16, indent=False)

    toc_headers = ["CH NO", "TITLE", "PAGE NO"]
    toc_data = [
        ["1", "INTRODUCTION", "3"],
        ["2", "OBJECTIVES", "4"],
        ["3", "DESCRIPTION", "5"],
        ["4", "CLASS DIAGRAM", "6"],
        ["5", "TABLE STRUCTURES", "7"],
        ["6", "ER DIAGRAM", "14"],
        ["7", "TECH STACK", "15"],
        ["8", "MODULES", "19"],
        ["", "8.1 FOLDER STRUCTURE & API ENDPOINTS", "19"],
        ["", "8.2 USER INTERFACE MODULES", "24"],
        ["", "8.3 SECURITY AND AUTHENTICATION", "36"],
        ["", "8.4 TESTING AND VERIFICATION", "36"],
        ["9", "CONCLUSION", "37"],
        ["10", "REFERENCES", "38"]
    ]
    create_table(toc_headers, toc_data, col_widths=[Inches(1.2), Inches(4.5), Inches(1.2)])

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 4: CHAPTER 1 - INTRODUCTION (Footer = 3)
    # ---------------------------------------------------------------------------
    print("Writing Page 4: Chapter 1 - Introduction...")
    add_chapter_header("1", "INTRODUCTION")

    add_para(
        "ClimaShield TN is an enterprise-grade geospatial climate intelligence and disaster resilience platform "
        "engineered specifically for the state of Tamil Nadu. With over 1,076 kilometers of coastline, fragile delta "
        "river basins, and dense metropolitan hubs, Tamil Nadu represents one of the most hydro-meteorologically "
        "vulnerable states in peninsular India. Over the last decade, extreme weather events—including the catastrophic "
        "December 2015 Chennai floods, Cyclone Vardah in 2016, Cyclone Gaja in 2018, Cyclone Nivar in 2020, and Cyclone "
        "Michaung in 2023—have underscored the urgent necessity of moving beyond fragmented, paper-based, or manual "
        "disaster management protocols."
    )

    add_para(
        "Historically, state emergency response has relied on disjointed communication channels: district control "
        "rooms coordinating via manual landline telephone calls, citizens struggling to identify nearby functioning "
        "relief centers during flash floods, and field incident reporting lacking precise GPS geolocation. ClimaShield "
        "TN directly replaces these inefficiencies with an integrated, reactive modern web platform that establishes an "
        "unbroken digital chain of custody from citizen hazard discovery to state command center verification and relief "
        "resource mobilization. The platform enforces strict Role-Based Access Control (RBAC) across three primary user "
        "tiers: Public Citizens, District Disaster Officers, and State Disaster Administrators."
    )

    add_para(
        "A Public Citizen can access interactive live weather maps, trigger an emergency SOS locator that automatically "
        "computes geodesic driving distances to verified relief shelters using PostgreSQL PostGIS, and report localized "
        "hazards (such as inundation, fallen trees, or power grid failures) with geotagged coordinates and photographic "
        "evidence. District Disaster Officers operate dedicated triage queues to review incoming citizen reports, verify "
        "severity levels, dispatch first responders, and monitor shelter occupancies in real time. State Disaster "
        "Administrators maintain high-level situational awareness across all 38 revenue districts, broadcast statewide "
        "emergency advisories, track audit logs, and simulate cyclone landfall scenarios."
    )

    add_para(
        "By leveraging modern web technologies—including React 18, Vite, Stitches CSS-in-JS, Node.js Express, Leaflet "
        "vector layers, D3 choropleth projections, and Supabase PostGIS—ClimaShield TN delivers sub-second map rendering, "
        "stateless JWT session management, and multi-decadal historical climate analytics. The platform bridges the gap "
        "between high-level atmospheric telemetry and grassroots community survival, establishing a resilient digital "
        "shield for Tamil Nadu."
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 5: CHAPTER 2 - OBJECTIVES (Footer = 4)
    # ---------------------------------------------------------------------------
    print("Writing Page 5: Chapter 2 - Objectives...")
    add_chapter_header("2", "OBJECTIVES", space_before=8, space_after=8)

    objectives = [
        "To provide role-based authentication using stateless JSON Web Tokens (JWT) and Bcrypt hashing, enforcing boundaries across Citizens, Officers, and Admins.",
        "To offer seamless single sign-on (SSO) authentication via Supabase Google OAuth 2.0 alongside localized credential registration.",
        "To engineer a centralized PostgreSQL database extended with PostGIS spatial geometry for master district boundaries, shelters, reports, and climate series.",
        "To render an interactive Tamil Nadu geospatial hazard map using Leaflet.js, incorporating district choropleths, weather markers, and Doppler radar overlays.",
        "To implement automated geodesic proximity routing using PostGIS ST_DWithin algorithms, locating nearest relief shelters with metric distances in kilometers.",
        "To empower citizens with a crowd-sourced hazard reporting portal supporting GPS capture, disaster taxonomy (Flood, Cyclone, Landslide), and photo uploads.",
        "To enforce an incident verification lifecycle governed by a server state machine (PENDING_REVIEW to VERIFIED_ACTIVE, REJECTED, RESOLVED) to prevent misinformation.",
        "To integrate multi-decadal climate observation datasets (1990–2024) across 8 core districts with temperature and rainfall trends visualized via Recharts.",
        "To construct an interactive Disaster Impact Simulator modeling cyclone trajectories and flood inundation zones to forecast affected population counts.",
        "To provide a Pan-India Climate Risk Overview utilizing D3.js GeoJSON choropleth mapping, evaluating state-level vulnerability indices.",
        "To deploy a bilingual Emergency AI Assistant (supporting English and Tamil) providing conversational evacuation guidelines, dos and don'ts, and helplines.",
        "To supply State Administrators with an executive command center displaying live metrics, shelter capacity utilization gauges, and immutable audit logs.",
        "To integrate external meteorological telemetry APIs, including OpenWeatherMap live weather feeds and RainViewer Doppler radar satellite tile layers.",
        "To maintain enterprise code quality, defensive data validation, HTTP security headers, CORS restrictions, and automated testing via Jest and Supertest."
    ]

    for obj in objectives:
        add_bullet(obj, bold_prefix="• ", space_before=1, space_after=2, size=10.5, line_spacing=1.05)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 6: CHAPTER 3 - DESCRIPTION (Footer = 5)
    # ---------------------------------------------------------------------------
    print("Writing Page 6: Chapter 3 - Description...")
    add_chapter_header("3", "DESCRIPTION")

    add_para(
        "ClimaShield TN is structured as a full-stack, distributed web platform designed to streamline disaster mitigation, "
        "accelerate emergency response, and deliver transparent climate intelligence across Tamil Nadu. The system is "
        "architected around a decoupled client-server paradigm comprising a high-performance React 18 single-page application "
        "and a robust Node.js Express RESTful backend connected to a managed Supabase PostgreSQL instance empowered by "
        "PostGIS geospatial extensions."
    )

    add_para(
        "The application organizes its operational capabilities into three distinct user tiers. Public Citizens interact "
        "with an intuitive emergency portal tailored for rapid decision-making during crises. Upon granting browser "
        "geolocation permissions, the platform queries backend spatial endpoints to pinpoint the citizen's exact district and "
        "calculate the closest emergency relief shelters within a 25-kilometer radius. If local conditions deteriorate, citizens "
        "can broadcast geo-tagged hazard reports complete with photographic evidence and categorical descriptions. These reports "
        "are instantly ingested into PostgreSQL, where an automated database trigger generates an EPSG:4326 PostGIS point geometry."
    )

    add_para(
        "District Disaster Officers and State Administrators operate within an authenticated command environment. Incoming citizen "
        "reports populate an operational triage queue flagged as 'PENDING_REVIEW'. Officers evaluate the authenticity of each submission, "
        "cross-referencing reported coordinates against live Doppler radar feeds and meteorological stations. Legitimate incidents are "
        "transitioned to 'VERIFIED_ACTIVE', triggering an automatic visual marker update on the public live map and logging an entry "
        "in the immutable audit ledger. Once emergency teams mitigate the on-ground risk, the incident status progresses to 'RESOLVED'."
    )

    add_para(
        "Beyond real-time crisis management, ClimaShield TN incorporates advanced analytical modules. The Disaster Time Machine "
        "allows urban planners and researchers to inspect 35 years of meteorological records across 8 core Tamil Nadu districts, "
        "correlating historical rainfall spikes with landmark flood events. The Disaster Impact Simulator enables administrators "
        "to run hypothetical cyclone landfall simulations along the Coromandel coast, projecting flood inundation zones and calculating "
        "evacuation resource requirements before catastrophic landfall occurs. All data transactions are secured using parameterized SQL, "
        "stateless JWT verification, and CORS domain white-listing, establishing a reliable technological standard for modern disaster governance."
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 7: CHAPTER 4 - CLASS DIAGRAM (Footer = 6)
    # ---------------------------------------------------------------------------
    print("Writing Page 7: Chapter 4 - Class Diagram...")
    add_chapter_header("4", "CLASS DIAGRAM", space_before=8, space_after=8)

    add_para(
        "The object-oriented structural model of ClimaShield TN is centered on the User entity, which establishes identity "
        "and role hierarchy across the platform. Every registered entity—whether a citizen, an officer, or an administrator—maps "
        "to a user record governing permissions, coordinates, and authentication providers. A User can author multiple CitizenReport "
        "instances and participate in incident lifecycles. The District entity anchors relief Shelter entities, HistoricalClimate "
        "observations, and crowd-sourced reports within its administrative perimeter. PostGIS geometry attributes enable spatial indexing.",
        space_after=6
    )

    add_figure('assets_report/fig4_1_class_diagram.png',
               "Fig 4.1 – Class Diagram – Classes (tables), their attributes, methods, and the relationships between them.",
               width=Inches(5.0), space_before=2, space_after=4)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 8: CHAPTER 5 - TABLE STRUCTURES (PAGE 1: USERS) (Footer = 7)
    # ---------------------------------------------------------------------------
    print("Writing Page 8: Chapter 5 - Table Structures (Users)...")
    add_chapter_header("5", "TABLE STRUCTURES", space_before=8, space_after=8)

    add_subsec_header("Users")
    add_para(
        "The users table stores core account profiles, authentication credentials, and role authorizations for all participants "
        "in the ClimaShield TN ecosystem. It supports three distinct user roles: CITIZEN, DISTRICT_OFFICER, and ADMIN. Passwords are "
        "securely hashed using Bcrypt before insertion. The table records home coordinates and assigned district boundaries to facilitate "
        "localized shelter calculations and role-based incident routing. Timestamps and provider flags support secure audit tracking.",
        space_after=6
    )

    user_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    user_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["email", "varchar(255)", "NO", "UNI", "NULL", "Unique constraint"],
        ["password_hash", "varchar(255)", "YES", "", "NULL", "Bcrypt hash"],
        ["full_name", "varchar(150)", "NO", "", "NULL", "Display name"],
        ["phone", "varchar(20)", "YES", "", "NULL", "Contact phone"],
        ["role", "user_role", "NO", "", "'CITIZEN'", "Enum: CITIZEN, OFFICER, ADMIN"],
        ["home_district", "varchar(100)", "YES", "", "'Chennai'", "Default district"],
        ["home_lat", "numeric(8,4)", "YES", "", "13.0827", "Default latitude"],
        ["home_lon", "numeric(8,4)", "YES", "", "80.2707", "Default longitude"],
        ["auth_provider", "varchar(50)", "YES", "", "'LOCAL'", "LOCAL or GOOGLE_OAUTH"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"]
    ]
    create_table(user_headers, user_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 9: CHAPTER 5 - TABLE STRUCTURES (PAGE 2: DISTRICTS) (Footer = 8)
    # ---------------------------------------------------------------------------
    print("Writing Page 9: Chapter 5 - Table Structures (Districts)...")
    add_subsec_header("Districts")
    add_para(
        "The districts table stores master records for Tamil Nadu revenue districts, administrative climate zones, centroid coordinates, "
        "and flood vulnerability flags. It serves as the relational anchor for shelters, historical climate series, and localized alerts. "
        "The geom column holds PostGIS spatial geometry boundaries enabling point-in-polygon queries for automatic district resolution.",
        space_after=6
    )

    dist_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    dist_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["name", "varchar(100)", "NO", "UNI", "NULL", "District Name"],
        ["zone", "varchar(100)", "NO", "", "NULL", "Climatic / River Basin Zone"],
        ["lat", "numeric(8,4)", "NO", "", "NULL", "Centroid Latitude"],
        ["lon", "numeric(8,4)", "NO", "", "NULL", "Centroid Longitude"],
        ["is_flood_prone", "boolean", "YES", "", "false", "High vulnerability flag"],
        ["geom", "geometry", "YES", "", "NULL", "PostGIS Polygon / Point (SRID 4326)"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"]
    ]
    create_table(dist_headers, dist_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 10: CHAPTER 5 - TABLE STRUCTURES (PAGE 3: SHELTERS) (Footer = 9)
    # ---------------------------------------------------------------------------
    print("Writing Page 10: Chapter 5 - Table Structures (Shelters)...")
    add_subsec_header("Shelters")
    add_para(
        "The shelters table catalogs emergency relief centers, community flood halls, and coastal cyclone shelters across Tamil Nadu. "
        "It maintains total capacity, live occupancy counts, emergency contact telephone numbers, and PostGIS geometry points (SRID 4326). "
        "This table powers the citizen emergency proximity locator, returning candidate relief facilities ordered by geodesic distance in kilometers.",
        space_after=6
    )

    sh_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    sh_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["district_id", "int", "YES", "MUL", "NULL", "FK -> districts(id)"],
        ["name", "varchar(150)", "NO", "", "NULL", "Relief Center Name"],
        ["capacity", "int", "NO", "", "500", "Maximum Capacity"],
        ["current_occupancy", "int", "NO", "", "0", "Live Occupancy Count"],
        ["lat", "numeric(8,4)", "NO", "", "NULL", "Latitude Coordinate"],
        ["lon", "numeric(8,4)", "NO", "", "NULL", "Longitude Coordinate"],
        ["contact_phone", "varchar(25)", "YES", "", "'+91-44-28888000'", "Helpdesk Hotline"],
        ["geom", "geometry", "YES", "", "NULL", "PostGIS Point (SRID 4326)"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"]
    ]
    create_table(sh_headers, sh_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 11: CHAPTER 5 - TABLE STRUCTURES (PAGE 4: HISTORICAL CLIMATE) (Footer = 10)
    # ---------------------------------------------------------------------------
    print("Writing Page 11: Chapter 5 - Table Structures (Historical Climate)...")
    add_subsec_header("Historical Climate")
    add_para(
        "The historical_climate table houses 35 years of monthly meteorological observations (1990–2024) across Tamil Nadu districts, "
        "encompassing mean temperatures, total rainfall, and extreme heat days. It is linked via a foreign key to districts(id) and "
        "powers the Disaster Time Machine multi-decadal analytics charts.",
        space_after=6
    )

    hc_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    hc_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["district_id", "int", "NO", "MUL", "NULL", "FK -> districts(id)"],
        ["year", "int", "NO", "", "NULL", "Observation Year (1990-2024)"],
        ["month", "int", "NO", "", "NULL", "Observation Month (1-12)"],
        ["avg_temp_c", "numeric(4,2)", "NO", "", "NULL", "Mean Temperature (°C)"],
        ["rainfall_mm", "numeric(6,2)", "NO", "", "0.0", "Total Precipitation (mm)"],
        ["extreme_heat_days", "int", "NO", "", "0", "Days Exceeding 40°C Threshold"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"]
    ]
    create_table(hc_headers, hc_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 12: CHAPTER 5 - TABLE STRUCTURES (PAGE 5: CITIZEN REPORTS) (Footer = 11)
    # ---------------------------------------------------------------------------
    print("Writing Page 12: Chapter 5 - Table Structures (Citizen Reports)...")
    add_subsec_header("Citizen Reports")
    add_para(
        "The citizen_reports table manages crowd-sourced disaster incident observations submitted by citizens across Tamil Nadu. It stores "
        "hazard classifications (Flood, Cyclone, Landslide, Waterlogging, Heatwave), detailed descriptions, geotagged latitude and longitude "
        "coordinates, photographic evidence URLs, and verification lifecycles. A PostgreSQL trigger function automatically calculates and populates "
        "the PostGIS geometry point (SRID 4326) on every insert or update.",
        space_after=4
    )

    cr_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    cr_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["user_id", "int", "YES", "MUL", "NULL", "FK -> users(id) ON DELETE SET NULL"],
        ["district", "varchar(100)", "NO", "", "'Chennai'", "District jurisdiction"],
        ["hazard_type", "varchar(100)", "NO", "", "'Flood'", "Hazard category taxonomy"],
        ["description", "text", "NO", "", "NULL", "Incident narrative description"],
        ["image_url", "text", "YES", "", "NULL", "Uploaded photo evidence URI"],
        ["reported_lat", "numeric(8,4)", "YES", "", "13.0827", "Reported GPS latitude"],
        ["reported_lon", "numeric(8,4)", "YES", "", "80.2707", "Reported GPS longitude"],
        ["status", "report_status", "YES", "", "'PENDING_REVIEW'", "PENDING, VERIFIED, RESOLVED, REJECTED"],
        ["verified_by", "int", "YES", "MUL", "NULL", "FK -> users(id) (Officer / Admin)"],
        ["geom", "geometry", "YES", "", "NULL", "PostGIS Point (SRID 4326) auto-updated"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"]
    ]
    create_table(cr_headers, cr_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 13: CHAPTER 5 - TABLE STRUCTURES (PAGE 6: ALERTS) (Footer = 12)
    # ---------------------------------------------------------------------------
    print("Writing Page 13: Chapter 5 - Table Structures (Alerts)...")
    add_subsec_header("Alerts")
    add_para(
        "The alerts table manages official emergency disaster advisories, meteorological bulletins, and civil defense notifications "
        "issued across the state of Tamil Nadu. It stores severity classifications (CRITICAL, SEVERE, MODERATE), geographic scopes "
        "(district-specific or statewide broadcasts), detailed multi-paragraph warning narratives, dispatching authorities, "
        "and automated expiration windows.",
        space_after=8
    )

    al_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    al_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["title", "varchar(150)", "NO", "", "'EMERGENCY ADVISORY'", "Headline alert summary"],
        ["severity", "varchar(50)", "NO", "", "'CRITICAL'", "CRITICAL, SEVERE, MODERATE"],
        ["target_district", "varchar(100)", "NO", "", "'Statewide'", "Target district or 'Statewide'"],
        ["message", "text", "NO", "", "NULL", "Detailed official advisory narrative"],
        ["dispatched_by", "varchar(100)", "YES", "", "NULL", "Issuing agency (e.g., TNSDMA Officer)"],
        ["is_active", "boolean", "YES", "", "true", "Active broadcast flag for client polling"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED timestamp"],
        ["expires_at", "timestamptz", "YES", "", "NOW() + 24 hours", "Automated alert expiration timestamp"]
    ]
    create_table(al_headers, al_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9.0, space_after_table=8)

    add_para(
        "A composite B-tree index on (is_active, expires_at) enables sub-millisecond retrieval of currently valid emergency "
        "broadcasts by the Express backend API during high-concurrency public traffic spikes. Furthermore, an administrative "
        "database trigger automatically deactivates expired alerts upon timestamp expiration, ensuring citizens are never "
        "presented with obsolete evacuation directives.",
        space_before=8, space_after=12
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 14: CHAPTER 5 - TABLE STRUCTURES (PAGE 7: USER ACTIVITY LOGS) (Footer = 13)
    # ---------------------------------------------------------------------------
    print("Writing Page 14: Chapter 5 - Table Structures (User Activity Logs)...")
    add_subsec_header("User Activity Logs")
    add_para(
        "The user_activity_logs table maintains an immutable, chronologically ordered audit trail of administrative operations, "
        "incident triage verifications, shelter capacity updates, and emergency broadcast dispatches executed across the platform. "
        "This table ensures strict non-repudiation and regulatory compliance for Tamil Nadu state emergency governance.",
        space_after=8
    )

    ual_headers = ["Field", "Type", "Null", "Key", "Default", "Extra"]
    ual_data = [
        ["id", "serial", "NO", "PRI", "nextval()", "auto_increment"],
        ["user_id", "int", "YES", "MUL", "NULL", "FK -> users(id) ON DELETE CASCADE"],
        ["activity_type", "varchar(50)", "NO", "", "NULL", "Action taxonomy (LOGIN, VERIFY, DISPATCH)"],
        ["target_entity", "varchar(150)", "NO", "", "NULL", "Affected entity identifier (e.g., Report #4)"],
        ["metadata", "jsonb", "YES", "", "'{}'::jsonb", "Extensible JSON payload of state transitions"],
        ["created_at", "timestamptz", "NO", "", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED timestamp"]
    ]
    create_table(ual_headers, ual_data, col_widths=[Inches(1.1), Inches(1.3), Inches(0.5), Inches(0.5), Inches(1.5), Inches(1.5)], font_size=8.5, header_size=9.0, space_after_table=8)

    add_para(
        "The metadata column utilizes PostgreSQL's native JSONB data type, backed by a Generalized Inverted Index (GIN). "
        "This architecture allows state compliance officers to execute complex deep-key queries—such as extracting prior "
        "verification statuses or geo-coordinates of modified shelter allocations—without incurring full-table scans. "
        "Foreign key cascading on user_id ensures referential consistency while preserving administrative audit records.",
        space_before=8, space_after=12
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 15: CHAPTER 6 - ER DIAGRAM (Footer = 14)
    # ---------------------------------------------------------------------------
    print("Writing Page 15: Chapter 6 - ER Diagram...")
    add_chapter_header("6", "ER DIAGRAM", space_before=8, space_after=8)

    add_para(
        "This Entity-Relationship (ER) diagram represents the conceptual and logical data architecture of ClimaShield TN, illustrating "
        "the entities, primary keys, foreign key constraints, PostGIS spatial relationships, and cardinality multipliers. The USERS entity "
        "connects to CITIZEN_REPORTS (1:N submissions and 1:N verifications) and USER_ACTIVITY_LOGS (1:N audit logs). The DISTRICTS entity "
        "anchors SHELTERS (1:N) and HISTORICAL_CLIMATE (1:N), maintaining spatial relationships across Tamil Nadu.",
        space_after=6
    )

    add_figure('assets_report/fig6_1_er_diagram.png',
               "Fig 6.1 – ER Diagram – Entity-Relationship model showing primary keys, foreign keys, PostGIS geometries, and cardinality.",
               width=Inches(5.4), space_before=2, space_after=4)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 15: CHAPTER 7 - TECH STACK (PART 1: ARCHITECTURE & FRONTEND) (Footer = 14)
    # ---------------------------------------------------------------------------
    print("Writing Page 15: Chapter 7 - Tech Stack (Frontend)...")
    add_chapter_header("7", "TECH STACK")

    add_subsec_header("Technologies and Architecture")
    add_para(
        "The ClimaShield TN platform is engineered as an enterprise-grade full-stack web application employing modern frontend, backend, "
        "geospatial, security, and data analytics technologies. The system adopts a modular Model-View-Controller (MVC) architectural pattern "
        "augmented by a dedicated spatial service layer. This architecture cleanly decouples presentation interfaces, business logic rules, "
        "spatial query engines, and database operations, making the platform maintainable, performant, and extensible."
    )

    add_subsec_header("Frontend Technologies")
    add_para(
        "The frontend is built using React.js 18 and Vite 8, delivering a reactive Single-Page Application (SPA) architecture with near-instant "
        "Hot Module Replacement (HMR) and optimized Rollup production bundling. Key frontend libraries and architectural choices include:"
    )

    add_bullet(
        "Stitches CSS-in-JS (@stitches/react): Used for component styling with zero-runtime CSS generation, atomic token architecture, "
        "and complete theme support, providing smooth transitions across dark and light presentation modes.",
        bold_prefix="• "
    )
    add_bullet(
        "Leaflet & React-Leaflet: Powers the interactive Tamil Nadu geospatial map. It handles district polygon boundaries, custom SVG hazard "
        "markers, OpenStreetMap basemaps, and real-time tile layer switches.",
        bold_prefix="• "
    )
    add_bullet(
        "D3.js (d3-geo, d3-scale, d3-scale-chromatic): Provides geospatial projections and color scales for the Pan-India climate risk choropleth "
        "map, translating regional vulnerability scores into visual representations.",
        bold_prefix="• "
    )
    add_bullet(
        "Recharts: Powers the Disaster Time Machine and climate analytics dashboards, rendering responsive, interactive time-series charts "
        "for multi-decadal temperature and precipitation metrics.",
        bold_prefix="• "
    )
    add_bullet(
        "Framer Motion: Delivers fluid micro-animations, modal transitions, toast alert notifications, and interactive status cards.",
        bold_prefix="• "
    )
    add_bullet(
        "Lucide React: Supplies a cohesive set of accessible iconography for hazard categories, meteorological indicators, and navigation controls.",
        bold_prefix="• "
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 16: CHAPTER 7 - TECH STACK (PART 2: BACKEND & MIDDLEWARE) (Footer = 15)
    # ---------------------------------------------------------------------------
    print("Writing Page 16: Chapter 7 - Tech Stack (Backend)...")
    add_subsec_header("Backend Technologies")
    add_para(
        "The backend is developed on Node.js using the Express 4 framework, structured as a RESTful API server. The backend processes incoming "
        "client requests, applies authentication and input validation pipelines, interacts with the PostgreSQL PostGIS database via connection "
        "pooling, and coordinates external meteorological services."
    )

    add_subsec_header("Middleware Architecture")
    add_para(
        "Multiple specialized middleware components enforce security, role boundaries, and operational observability across the API pipeline:"
    )

    add_bullet(
        "JWT Authentication Middleware (authMiddleware.js): Intercepts protected requests, verifies the authenticity of the JSON Web Token "
        "passed in the HTTP Authorization header (Bearer token), decodes the authenticated user payload, and attaches the user context to the request.",
        bold_prefix="• "
    )
    add_bullet(
        "Role-Based Access Control Middleware (roleMiddleware.js): Evaluates user roles against endpoint requirements. Restricts administrative "
        "incident verification and emergency broadcasting to ADMIN and DISTRICT_OFFICER accounts, while permitting public hazard reporting for CITIZEN accounts.",
        bold_prefix="• "
    )
    add_bullet(
        "CORS (Cross-Origin Resource Sharing): Restricts resource access to authorized frontend origins, preventing unauthorized cross-origin requests.",
        bold_prefix="• "
    )
    add_bullet(
        "Morgan Logging: Captures real-time HTTP request logs, response status codes, execution latencies, and route invocations in development and staging.",
        bold_prefix="• "
    )
    add_bullet(
        "Centralized Error Handler: Catches unhandled exceptions and database errors, logging stack traces securely while returning formatted "
        "JSON error messages to clients without leaking sensitive database internals.",
        bold_prefix="• "
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 17: CHAPTER 7 - TECH STACK (PART 3: DATABASE & SPATIAL APIS) (Footer = 16)
    # ---------------------------------------------------------------------------
    print("Writing Page 17: Chapter 7 - Tech Stack (PostGIS & External APIs)...")
    add_subsec_header("Database & Geospatial Technologies")
    add_para(
        "ClimaShield TN employs PostgreSQL hosted on Supabase Cloud, enhanced with the PostGIS spatial extension. Unlike standard relational databases "
        "that handle geographic coordinates as flat numeric pairs, PostGIS treats geospatial data as first-class geometric objects obeying spherical "
        "geodesic mathematics. Key database design highlights include:"
    )

    add_bullet(
        "Geodesic Proximity Engine (ST_DWithin): Implements distance queries using the WGS 84 geographic coordinate system (SRID 4326). Computes "
        "precise spherical distance between a citizen's GPS coordinates and emergency relief shelters, filtering candidates within a specified kilometer radius.",
        bold_prefix="• "
    )
    add_bullet(
        "Spatial Indexing (GiST R-Tree): Builds Generalized Search Tree (GiST) bounding-box spatial indexes on geometry columns across districts, shelters, "
        "and citizen reports, ensuring logarithmic search performance across thousands of spatial objects.",
        bold_prefix="• "
    )
    add_bullet(
        "PostgreSQL Connection Pool (pg): Utilizes node-postgres connection pooling to maintain persistent database connections, optimizing query "
        "throughput during emergency traffic spikes.",
        bold_prefix="• "
    )

    add_subsec_header("External Meteorological Telemetry")
    add_para(
        "The platform interfaces with authoritative external meteorological APIs to ensure real-time environmental awareness:"
    )

    add_bullet(
        "OpenWeatherMap API: Supplies real-time district atmospheric metrics, including ambient temperature, humidity, wind velocity, gust speed, "
        "and barometric pressure readings.",
        bold_prefix="• "
    )
    add_bullet(
        "RainViewer Radar API: Supplies live Doppler weather radar tile layers, allowing users to visualize moving storm cells, precipitation bands, "
        "and cyclone clouds directly over the Tamil Nadu map.",
        bold_prefix="• "
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 18: CHAPTER 7 - TECH STACK (PART 4: SYSTEM ARCHITECTURE DIAGRAM) (Footer = 17)
    # ---------------------------------------------------------------------------
    print("Writing Page 18: Chapter 7 - System Architecture Diagram...")
    add_subsec_header("Multi-Tier System Architecture")
    add_para(
        "The end-to-end architecture of ClimaShield TN is illustrated in Figure 7.1. The platform operates across three interconnected tiers: "
        "the Client Presentation Layer (SPA Frontend), the Application API & Middleware Layer (Express REST), and the Persistence & Telemetry "
        "Infrastructure Layer (PostgreSQL, PostGIS, and external weather streams). Communication between tiers follows stateless HTTP/HTTPS "
        "protocols with JWT bearer tokens and parameterized database connections.",
        space_after=6
    )

    add_figure('assets_report/fig7_1_system_architecture.png',
               "Fig 7.1 – Multi-Tier System Architecture – Detailed multi-tier diagram showing Client View, Express Controller/Middleware, Service Layer, and PostgreSQL/PostGIS Data Tier.",
               width=Inches(5.4), space_before=2, space_after=4)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 19: CHAPTER 8.1 - FOLDER STRUCTURE & API (BACKEND TREE) (Footer = 18)
    # ---------------------------------------------------------------------------
    print("Writing Page 19: Chapter 8.1 - Backend Folder Structure...")
    add_chapter_header("8", "MODULES", space_before=8, space_after=6)
    add_sec_header("8.1 FOLDER STRUCTURE", space_before=4, space_after=2)

    add_subsec_header("BACKEND FOLDER STRUCTURE", space_before=4, space_after=2)
    add_para(
        "The backend repository is organized around a modular, feature-oriented directory hierarchy that separates route declarations, "
        "request controllers, authentication middlewares, database configuration, seed data, and automated test suites:",
        space_after=4
    )

    backend_tree = (
        "climashield-tn/server/\n"
        "├── package.json               # Dependencies and test scripts\n"
        "├── schema.sql                 # PostgreSQL DDL, PostGIS extensions, & triggers\n"
        "├── .env                       # Database URL and environment configuration\n"
        "├── src/\n"
        "│   ├── app.js                 # Express server entry point, CORS, & error handler\n"
        "│   ├── config/\n"
        "│   │   └── db.js              # PostgreSQL connection pool configuration\n"
        "│   ├── controllers/\n"
        "│   │   ├── authController.js     # User registration, login, and JWT issuance\n"
        "│   │   ├── incidentController.js # Citizen hazard reports & state transitions\n"
        "│   │   ├── shelterController.js  # PostGIS geodesic shelter proximity queries\n"
        "│   │   ├── climateController.js  # Multi-decadal historical climate series\n"
        "│   │   ├── adminController.js    # Command center metrics and audit logs\n"
        "│   │   ├── alertController.js    # Emergency advisories broadcast management\n"
        "│   │   ├── chatbotController.js  # Multilingual emergency response engine\n"
        "│   │   └── systemController.js   # Database health check and seed diagnostics\n"
        "│   ├── middlewares/\n"
        "│   │   ├── authMiddleware.js     # JWT bearer token verification pipeline\n"
        "│   │   └── roleMiddleware.js     # Role-Based Access Control (RBAC) authorizer\n"
        "│   ├── routes/\n"
        "│   │   ├── authRoutes.js, incidentRoutes.js, shelterRoutes.js\n"
        "│   │   ├── climateRoutes.js, adminRoutes.js, alertRoutes.js\n"
        "│   │   └── chatbotRoutes.js, systemRoutes.js\n"
        "│   └── seeds/\n"
        "│       └── seedData.js           # Database seeder (Districts, Shelters, Climate)\n"
        "└── tests/\n"
        "    └── api.test.js               # Jest & Supertest automated integration suite"
    )

    p_tree = doc.add_paragraph()
    p_tree.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_tree.paragraph_format.space_before = Pt(2)
    p_tree.paragraph_format.space_after = Pt(6)
    p_tree.paragraph_format.left_indent = Inches(0.2)
    r_tree = p_tree.add_run(backend_tree)
    r_tree.font.name = 'Courier New'
    r_tree.font.size = Pt(8.0)

    add_para("Fig 8.1 – Backend Folder Structure – Overall organization of backend files and directories showing modular architecture.",
             align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10, indent=False)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 20: CHAPTER 8.1 - API ROUTES TABLE (Footer = 19)
    # ---------------------------------------------------------------------------
    print("Writing Page 20: Chapter 8.1 - RESTful API Routes Table...")
    add_subsec_header("BACKEND RESTFUL API ROUTES", space_before=4, space_after=2)
    add_para(
        "The ClimaShield TN backend exposes a clean RESTful API suite under /api/v1. Route handlers apply authentication "
        "and role middlewares before invoking the corresponding controller functions:",
        space_after=4
    )

    api_headers = ["Method", "Endpoint", "Access", "Purpose & Description"]
    api_data = [
        ["POST", "/api/v1/auth/register", "Public", "Register new citizen profile with Bcrypt hashing"],
        ["POST", "/api/v1/auth/login", "Public", "Authenticate user credentials; issue stateless JWT"],
        ["GET", "/api/v1/auth/me", "Auth", "Retrieve active user profile and home district"],
        ["GET", "/api/v1/shelters/nearby", "Public", "PostGIS ST_DWithin geodesic shelter proximity query"],
        ["GET", "/api/v1/shelters", "Public", "List all emergency relief shelters statewide"],
        ["GET", "/api/v1/incidents", "Public", "Retrieve crowd-sourced disaster incident reports"],
        ["POST", "/api/v1/incidents", "Auth", "Submit new geotagged incident report with photo"],
        ["PATCH", "/api/v1/incidents/:id/status", "Officer/Admin", "Update report status (VERIFIED, REJECTED, RESOLVED)"],
        ["GET", "/api/v1/climate/historical", "Public", "Query 35-year climate time-series (1990-2024)"],
        ["GET", "/api/v1/climate/districts", "Public", "Retrieve master Tamil Nadu districts and zones"],
        ["GET", "/api/v1/alerts", "Public", "Stream active emergency warnings and weather alerts"],
        ["POST", "/api/v1/alerts", "Admin", "Broadcast official statewide disaster emergency advisory"],
        ["GET", "/api/v1/admin/stats", "Officer/Admin", "Command center summary: triage, shelters, logs"],
        ["GET", "/api/v1/admin/audit-logs", "Admin", "Fetch immutable security and operation audit trail"],
        ["POST", "/api/v1/chat", "Public", "Multilingual emergency response assistant (EN/TA)"],
        ["GET", "/api/v1/system/status", "Public", "Diagnostic health check and database seed counts"]
    ]
    create_table(api_headers, api_data, col_widths=[Inches(0.8), Inches(2.3), Inches(1.1), Inches(2.5)], font_size=8.0, header_size=8.5, space_after_table=4)

    add_para("Table 8.2 – Backend Routes – RESTful API routes connecting client requests to backend controllers.",
             align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10, indent=False)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 21: CHAPTER 8.1 - FRONTEND FOLDER STRUCTURE (Footer = 20)
    # ---------------------------------------------------------------------------
    print("Writing Page 21: Chapter 8.1 - Frontend Folder Structure...")
    add_subsec_header("FRONTEND FOLDER STRUCTURE", space_before=4, space_after=2)
    add_para(
        "The frontend architecture is organized into dedicated directories for views, reusable components, context providers, "
        "and theme configuration, ensuring high modularity and maintainability:",
        space_after=4
    )

    frontend_tree = (
        "climashield-tn/\n"
        "├── index.html                 # HTML5 entry shell & Google Fonts imports\n"
        "├── vite.config.js             # Vite configuration with React compiler\n"
        "├── package.json               # Frontend dependencies & scripts\n"
        "└── src/\n"
        "    ├── main.jsx               # React DOM root entry point\n"
        "    ├── App.jsx                # Router, role guards, & layout wrapper\n"
        "    ├── stitches.config.js     # Stitches design tokens & dark/light theme\n"
        "    ├── index.css              # Global CSS resets & Leaflet map styles\n"
        "    ├── context/\n"
        "    │   ├── AuthContext.jsx       # User authentication state & JWT persistence\n"
        "    │   └── LanguageContext.jsx   # Bilingual dictionary (English & Tamil)\n"
        "    ├── components/\n"
        "    │   ├── Navbar.jsx            # Responsive navigation header\n"
        "    │   ├── ProtectedRoute.jsx    # Role-based route guard component\n"
        "    │   ├── EmergencyChatbot.jsx  # Floating conversational disaster assistant\n"
        "    │   ├── IndiaChoroplethMap.jsx# D3-Geo Pan-India climate risk choropleth\n"
        "    │   ├── RecentlyAccessedBar.jsx # User interaction history quick shortcuts\n"
        "    │   └── Card.jsx, Button.jsx  # Reusable atomic Stitches UI elements\n"
        "    ├── pages/\n"
        "    │   ├── HomePage.jsx          # Public landing portal & emergency helplines\n"
        "    │   ├── TamilNaduLiveMap.jsx  # Live Leaflet hazard map with radar overlays\n"
        "    │   ├── CitizenDashboard.jsx  # Citizen emergency hub & nearby shelters\n"
        "    │   ├── ReportIncidentPage.jsx# Geotagged incident reporting form\n"
        "    │   ├── AdminCommandCenter.jsx# State disaster command center & triage\n"
        "    │   ├── DisasterSimulator.jsx # Cyclone & flood inundation simulator\n"
        "    │   ├── TimeMachine.jsx       # 35-year climate time-series visualization\n"
        "    │   ├── IndiaOverview.jsx     # Pan-India comparative climate risk page\n"
        "    │   ├── LiveAlerts.jsx        # Real-time meteorological alerts stream\n"
        "    │   ├── ArchitectureHub.jsx   # Interactive microservices & PostGIS hub\n"
        "    │   └── Login.jsx             # Role-based login & account registration\n"
        "    └── services/\n"
        "        ├── weatherService.js     # OpenWeatherMap API client\n"
        "        └── rainViewerService.js  # RainViewer Doppler radar tile service"
    )

    p_ftree = doc.add_paragraph()
    p_ftree.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_ftree.paragraph_format.space_before = Pt(2)
    p_ftree.paragraph_format.space_after = Pt(6)
    p_ftree.paragraph_format.left_indent = Inches(0.2)
    r_ftree = p_ftree.add_run(frontend_tree)
    r_ftree.font.name = 'Courier New'
    r_ftree.font.size = Pt(8.0)

    add_para("Fig 8.3 – Frontend Folder Structure – Layout of the React-based frontend directories with components and pages.",
             align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10, indent=False)

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 22: CHAPTER 8.1 - BACKEND MODULE DESCRIPTIONS (Footer = 21)
    # ---------------------------------------------------------------------------
    print("Writing Page 22: Chapter 8.1 - Backend Module Breakdown...")
    add_subsec_header("1. Backend API Server Modules")
    add_para(
        "The backend server, located in the server/ directory, handles all server-side logic, geospatial computing, data validation, "
        "and security enforcement. It is built as a modular Node.js/Express service connected to PostgreSQL via connection pooling:"
    )

    add_bullet(
        "API Routing (routes/): Defines all REST API endpoints under /api/v1. Routes are grouped logically by domain (auth, incidents, shelters, "
        "climate, admin, alerts, chat, system) and protected with authentication and role middlewares.",
        bold_prefix="• "
    )
    add_bullet(
        "Business Logic Controllers (controllers/): Executes the core logic for each API request. Handles user credential verification, "
        "incident report submissions, triage status transitions, and analytical data aggregation.",
        bold_prefix="• "
    )
    add_bullet(
        "Geospatial Services (controllers/shelterController.js): Implements PostGIS spatial operations. Executes ST_DWithin and geodesic "
        "distance queries using the WGS 84 ellipsoid (SRID 4326), returning candidate shelters ranked by proximity in kilometers.",
        bold_prefix="• "
    )
    add_bullet(
        "Database Module (config/db.js, schema.sql, seeds/seedData.js): Manages PostgreSQL connection pools using the pg client library, "
        "enforces table schemas and spatial triggers, and provides idempotent database seeding with 3,360 climate observations.",
        bold_prefix="• "
    )
    add_bullet(
        "Middleware Pipeline (middlewares/): Validates JWT tokens on protected routes, checks role permissions against user accounts, and "
        "intercepts errors to return formatted JSON responses.",
        bold_prefix="• "
    )
    add_bullet(
        "Server Core (app.js): Application entry point that configures CORS white-listing, Morgan HTTP logging, JSON body parsing, health check "
        "endpoints, and graceful port conflict handling.",
        bold_prefix="• "
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 23: CHAPTER 8.1 - FRONTEND MODULE DESCRIPTIONS (Footer = 22)
    # ---------------------------------------------------------------------------
    print("Writing Page 23: Chapter 8.1 - Frontend Module Breakdown...")
    add_subsec_header("2. Frontend User Interface Modules")
    add_para(
        "The frontend, located in the src/ directory, is a reactive Single-Page Application (SPA) built with React 18 and Vite. It is "
        "responsible for user interaction, geospatial map rendering, dynamic data visualization, and localized language presentation:"
    )

    add_bullet(
        "Page Views (pages/): Top-level application views mapping to URL routes. Includes the public Home landing page, the live Tamil Nadu "
        "Hazard Map, the Citizen Emergency Portal, the Incident Reporting Form, the Admin Command Center, the Disaster Impact Simulator, the "
        "Disaster Time Machine, the Pan-India Overview, and the Architecture Hub.",
        bold_prefix="• "
    )
    add_bullet(
        "Geospatial Map Components (TamilNaduLiveMap.jsx, IndiaChoroplethMap.jsx): Renders interactive maps using Leaflet and D3-Geo. Displays "
        "district polygon boundaries, live weather markers, Doppler radar tile layers, and crowd-sourced hazard incidents.",
        bold_prefix="• "
    )
    add_bullet(
        "State and Authentication Management (context/AuthContext.jsx): Centralizes user session state. Manages JWT persistence in localStorage, "
        "attaches bearer tokens to API requests, and handles user login, logout, and automatic session restoration.",
        bold_prefix="• "
    )
    add_bullet(
        "Multilingual Engine (context/LanguageContext.jsx): Provides real-time language switching between English and Tamil (தமிழ்) across "
        "navigation items, incident forms, safety advisories, and the emergency chatbot.",
        bold_prefix="• "
    )
    add_bullet(
        "Design System & Theming (stitches.config.js): Defines atomic design tokens (colors, typography, spacing, shadows) using Stitches CSS-in-JS, "
        "delivering consistent styling without runtime CSS overhead.",
        bold_prefix="• "
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 24: CHAPTER 8.2 - USER INTERFACE (HOME PAGE) (Footer = 23)
    # ---------------------------------------------------------------------------
    print("Writing Page 24: Chapter 8.2 - Home Page...")
    add_sec_header("8.2 USER INTERFACE MODULES")
    add_subsec_header("HOME PAGE")

    add_para(
        "The Home Page (/home) serves as the primary public entry point to ClimaShield TN, designed to deliver immediate situational "
        "awareness and emergency guidance during crises. It features an active emergency alert banner displaying high-priority meteorological "
        "warnings, real-time platform metric cards (monitoring monitored districts, active emergency shelters, historical climate datasets, "
        "and crowd-sourced incident reports), and direct quick-action shortcuts for locating shelters and reporting localized hazards.",
        space_after=4
    )

    add_para(
        "The page also integrates direct emergency helpline cards providing one-touch calling to key response agencies, including the Tamil Nadu "
        "State Disaster Management Authority (TNSDMA - 1070), District Emergency Operations Centers (1077), Police Control (100), Fire and Rescue "
        "(101), and Medical Emergency Services (108).",
        space_after=6
    )

    add_figure('assets_report/fig8_4_home.png',
               "Fig 8.4 – Home Page – Landing page introducing ClimaShield TN, emergency helplines, and live climate statistics.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 25: CHAPTER 8.2 - USER INTERFACE (TAMIL NADU LIVE MAP) (Footer = 24)
    # ---------------------------------------------------------------------------
    print("Writing Page 25: Chapter 8.2 - Tamil Nadu Live Map...")
    add_subsec_header("LIVE TAMIL NADU HAZARD MAP")

    add_para(
        "The Tamil Nadu Live Map (/tn-map / /) provides a comprehensive geospatial monitoring interface for the state. Built with Leaflet.js, "
        "it plots all 38 district administrative boundaries, styling high-risk coastal zones and river basins with distinctive thematic overlays. "
        "The map integrates live telemetry from weather stations, plotting interactive markers that display current ambient temperatures, wind "
        "gusts, and atmospheric pressure on hover.",
        space_after=4
    )

    add_para(
        "A key capability is the Doppler precipitation radar overlay powered by the RainViewer satellite tile service. Users can toggle "
        "radar layers to observe real-time rainfall intensity and moving cyclone storm cells over the Bay of Bengal. Verified crowd-sourced "
        "incident reports (flooding, tree falls, electrical hazards) appear as color-coded hazard markers with popup detail drawers.",
        space_after=6
    )

    add_figure('assets_report/fig8_4b_tn_live_map.png',
               "Fig 8.4b – Tamil Nadu Live Hazard Map – Interactive Leaflet map displaying live weather telemetry, radar overlays, and district hazard boundaries.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 26: CHAPTER 8.2 - USER INTERFACE (LOGIN & REGISTRATION) (Footer = 25)
    # ---------------------------------------------------------------------------
    print("Writing Page 26: Chapter 8.2 - Login & Registration...")
    add_subsec_header("REGISTRATION AND LOGIN")

    add_para(
        "The Authentication Portal (/login) provides role-based access control for ClimaShield TN. The portal supports two primary "
        "modes: Account Sign-In and Citizen Registration. The registration workflow collects the user's full name, email, contact telephone "
        "number, home district, and password. The backend securely hashes the password using Bcrypt before saving it to PostgreSQL.",
        space_after=4
    )

    add_para(
        "To streamline testing, evaluation, and role demonstration, the login page features an interactive Quick Persona Selector. Users can "
        "sign in with pre-seeded accounts: Public Citizen (Darika Sivakumar), District Disaster Officer (Chennai or Thoothukudi), or State Disaster "
        "Commander (Admin). Upon authentication, the backend issues a signed JWT token containing the user's role and identity.",
        space_after=6
    )

    add_figure('assets_report/fig8_5_login.png',
               "Fig 8.5 – Registration and Login Pages – Account authentication and role-based credential picker.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 27: CHAPTER 8.2 - USER INTERFACE (CITIZEN DASHBOARD) (Footer = 26)
    # ---------------------------------------------------------------------------
    print("Writing Page 27: Chapter 8.2 - Citizen Dashboard...")
    add_subsec_header("CITIZEN EMERGENCY PORTAL")

    add_para(
        "The Citizen Emergency Dashboard (/citizen) is tailored for community members seeking safety during extreme weather events. The interface "
        "prominently displays an emergency SOS trigger that reads browser GPS coordinates and queries the backend PostGIS shelter routing API. "
        "Within milliseconds, the system identifies all operating relief camps within a 25-kilometer radius, displaying capacity utilization gauges, "
        "driving distances, and contact telephone numbers.",
        space_after=4
    )

    add_para(
        "The dashboard also provides a localized safety assessment for the citizen's registered home district, indicating active meteorological "
        "alerts, flood risk levels, and recommended protective actions. A personal incident tracking panel lists all reports previously filed by the "
        "citizen, indicating whether each report is currently under review, verified by an officer, or resolved on the ground.",
        space_after=6
    )

    add_figure('assets_report/fig8_6_citizen_dashboard.png',
               "Fig 8.6 – Citizen Dashboard – Citizen emergency dashboard with SOS alert, nearby relief shelter finder, and active hazard alerts.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 28: CHAPTER 8.2 - USER INTERFACE (REPORT INCIDENT) (Footer = 27)
    # ---------------------------------------------------------------------------
    print("Writing Page 28: Chapter 8.2 - Report Incident Form...")
    add_subsec_header("CITIZEN HAZARD INCIDENT REPORTING")

    add_para(
        "The Report Incident Page (/report) empowers citizens to act as ground-level disaster sensors by crowdsourcing localized hazard reports. "
        "The form includes an automated 'Use My Current Location' button that populates exact GPS coordinates (latitude and longitude) from the "
        "device's geolocation sensor, as well as an interactive map pin adjuster for fine-tuning.",
        space_after=4
    )

    add_para(
        "Users categorize the hazard using a standardized taxonomy—including Flood, Cyclone, Landslide, Waterlogging, Tree Fall, Electrical Hazard, "
        "or Heatwave—and provide a descriptive summary of the situation. Users can attach photographic evidence URLs to substantiate the report. "
        "Upon submission, the record is inserted into PostgreSQL with a PENDING_REVIEW status, and an automated database trigger creates an EPSG:4326 "
        "PostGIS point geometry for spatial indexation.",
        space_after=6
    )

    add_figure('assets_report/fig8_7_report_incident.png',
               "Fig 8.7 – Report Incident Form – Geo-tagged citizen hazard submission interface with location coordinates and incident details.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 29: CHAPTER 8.2 - USER INTERFACE (DISASTER TIME MACHINE) (Footer = 28)
    # ---------------------------------------------------------------------------
    print("Writing Page 29: Chapter 8.2 - Disaster Time Machine...")
    add_subsec_header("DISASTER TIME MACHINE")

    add_para(
        "The Disaster Time Machine (/timeline) provides an interactive analytical environment for exploring 35 years of climate history across "
        "Tamil Nadu (1990–2024). Users can select any of the 8 core monitoring districts—including Chennai, Coimbatore, Madurai, Tiruchirappalli, "
        "Salem, Tirunelveli, Thoothukudi, and Cuddalore—and specify custom year ranges to generate dynamic time-series charts.",
        space_after=4
    )

    add_para(
        "Powered by Recharts, the interface graphs annual mean temperatures, cumulative rainfall totals, and extreme heat days, revealing "
        "multi-decadal climate shifts. Interactive event markers spotlight historic disaster milestones—such as the 2015 Chennai Floods, Cyclone Vardah, "
        "Cyclone Gaja, and Cyclone Michaung—allowing researchers and policymakers to correlate observed meteorological anomalies with past disaster outcomes.",
        space_after=6
    )

    add_figure('assets_report/fig8_8_time_machine.png',
               "Fig 8.8 – Disaster Time Machine – Historical climate analysis and multi-decadal disaster timeline interface.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 30: CHAPTER 8.2 - USER INTERFACE (DISASTER SIMULATOR) (Footer = 29)
    # ---------------------------------------------------------------------------
    print("Writing Page 30: Chapter 8.2 - Disaster Simulator...")
    add_subsec_header("DISASTER IMPACT SIMULATOR")

    add_para(
        "The Disaster Impact Simulator (/simulator) is a decision-support tool designed for emergency planners and disaster officers. It allows "
        "administrators to model hypothetical cyclone landfall trajectories along the Tamil Nadu coastline, adjusting parameters such as cyclone "
        "category (Category 1 to 5), wind velocity (up to 250 km/h), central atmospheric pressure, and projected rainfall intensity.",
        space_after=4
    )

    add_para(
        "The simulation engine calculates dynamic flood inundation buffer zones around vulnerable river basins and low-lying coastal areas. "
        "It generates impact projections, including estimated affected population counts, high-risk household totals, required relief shelter "
        "capacities, and recommended emergency medical personnel deployments, enabling proactive resource positioning prior to storm landfall.",
        space_after=6
    )

    add_figure('assets_report/fig8_9_disaster_simulator.png',
               "Fig 8.9 – Disaster Simulator – Interactive simulation engine for cyclone tracking and flood inundation impact modeling.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 31: CHAPTER 8.2 - USER INTERFACE (INDIA OVERVIEW) (Footer = 30)
    # ---------------------------------------------------------------------------
    print("Writing Page 31: Chapter 8.2 - Pan-India Overview...")
    add_subsec_header("PAN-INDIA CLIMATE RISK OVERVIEW")

    add_para(
        "The Pan-India Climate Overview (/india) contextualizes Tamil Nadu's climate exposure within the broader national landscape. Using D3.js "
        "and TopoJSON/GeoJSON projections, the page renders a vector choropleth map of India, color-coding all states and union territories according "
        "to composite climate vulnerability indices.",
        space_after=4
    )

    add_para(
        "Hovering over or selecting any state opens a drill-down detail panel showing specific vulnerability metrics, including cyclone frequency, "
        "flood risk exposure, drought susceptibility, and heat stress indices. This comparative perspective helps state disaster managers understand "
        "inter-state climate patterns and coordinate interstate resource sharing during regional disaster events.",
        space_after=6
    )

    add_figure('assets_report/fig8_10_india_overview.png',
               "Fig 8.10 – Pan-India Climate Risk Overview – D3.js choropleth visualization of climate vulnerability across Indian states.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 32: CHAPTER 8.2 - INCIDENT LIFECYCLE STATE MACHINE (Footer = 31)
    # ---------------------------------------------------------------------------
    print("Writing Page 32: Chapter 8.2 - Incident Verification Lifecycle...")
    add_subsec_header("INCIDENT VERIFICATION LIFECYCLE")

    add_para(
        "Every crowd-sourced incident report submitted to ClimaShield TN passes through a controlled state machine enforced by backend business "
        "logic. When a citizen submits a hazard observation, the record is initialized as PENDING_REVIEW. District disaster officers inspect incoming "
        "reports in their triage queue, verifying geotagged coordinates against satellite imagery and weather station feeds.",
        space_after=4
    )

    add_para(
        "If confirmed, the officer transitions the status to VERIFIED_ACTIVE. This automatically updates the public live hazard map, broadcasting "
        "an active hazard pin and notifying nearby relief response teams. If a report is erroneous or duplicate, the officer marks it REJECTED, "
        "recording the dismissal in the audit ledger. Once emergency teams clear the hazard, the report transitions to RESOLVED, archiving the record.",
        space_after=6
    )

    add_figure('assets_report/fig8_11_incident_lifecycle.png',
               "Fig 8.11 – Incident Lifecycle State Machine – Verification state transitions from citizen submission to resolution.",
               width=Inches(5.4))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 33: CHAPTER 8.2 - USER INTERFACE (ADMIN COMMAND CENTER) (Footer = 32)
    # ---------------------------------------------------------------------------
    print("Writing Page 33: Chapter 8.2 - Admin Command Center...")
    add_subsec_header("STATE DISASTER COMMAND CENTER")

    add_para(
        "The State Disaster Command Center (/admin) serves as the primary operational hub for disaster officers and state administrators. The "
        "dashboard provides a real-time situational overview featuring platform-wide stat cards: total registered incidents, active verified hazards, "
        "statewide relief shelter capacity, and current overall shelter occupancy.",
        space_after=4
    )

    add_para(
        "The central Incident Triage Queue displays all incoming citizen reports, showing hazard categories, submission timestamps, GPS coordinates, "
        "and attached evidence photos. Officers can review evidence and execute one-click status transitions (Verify, Reject, or Resolve). An "
        "interactive Shelter Management panel provides real-time occupancy updates, while the System Audit Log maintains an immutable chronological "
        "record of all administrative actions, ensuring complete operational transparency.",
        space_after=6
    )

    add_figure('assets_report/fig8_12_admin_command_center.png',
               "Fig 8.12 – Admin Command Center – State disaster command center with incident triage, shelter monitoring, and system metrics.",
               width=Inches(5.2))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 34: CHAPTER 8.2 - EMERGENCY CHATBOT (Footer = 33)
    # ---------------------------------------------------------------------------
    print("Writing Page 34: Chapter 8.2 - Emergency Chatbot...")
    add_subsec_header("EMERGENCY AI CHATBOT ASSISTANT")

    add_para(
        "The Emergency AI Chatbot is an interactive conversational widget accessible across the platform via a persistent floating action button. "
        "The assistant operates in both English and Tamil (தமிழ்), providing instant answers to common disaster queries. Citizens can ask about "
        "flood safety measures, cyclone preparation guidelines, the nearest functioning relief shelters, and district emergency telephone helplines.",
        space_after=4
    )

    add_para(
        "The assistant processes natural-language inquiries through a dedicated backend intent parser (/api/v1/chat), matching queries against "
        "verified disaster response guidelines, meteorological definitions, and active shelter occupancies. By supporting localized Tamil vernacular, "
        "the chatbot ensures that critical emergency advisories are accessible to all citizens regardless of language barriers.",
        space_after=6
    )

    add_figure('assets_report/fig8_13_emergency_chatbot.png',
               "Fig 8.13 – Emergency AI Chatbot – Multilingual conversational assistant providing emergency guidance and shelter coordinates.",
               width=Inches(5.0))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 35: CHAPTER 8.2 - ARCHITECTURE HUB (Footer = 34)
    # ---------------------------------------------------------------------------
    print("Writing Page 35: Chapter 8.2 - Architecture Hub...")
    add_subsec_header("ARCHITECTURE & POSTGIS SPATIAL EXPLORER")

    add_para(
        "The Architecture Hub (/architecture) provides an interactive system topology explorer for administrators and engineers. It details the "
        "multi-tier data pipeline, visualizes database entity relationships, and demonstrates live PostGIS geodesic SQL queries (such as ST_DWithin "
        "and ST_MakePoint), offering transparency into the underlying geospatial algorithms powering ClimaShield TN.",
        space_after=4
    )

    add_para(
        "The interface highlights key architectural innovations, including the decoupling of vector Leaflet rendering from tile layers, the "
        "stateless verification pipeline of JWT sessions, and the performance characteristics of PostgreSQL R-Tree GiST spatial indexing, "
        "demonstrating engineering rigor across every layer of the modern web stack.",
        space_after=6
    )

    add_figure('assets_report/fig8_14_architecture_hub.png',
               "Fig 8.14 – Architecture Hub – Interactive system architecture and PostGIS query explorer.",
               width=Inches(5.0))

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 36: CHAPTER 8.3 & 8.4 - SECURITY & TESTING (Footer = 35)
    # ---------------------------------------------------------------------------
    print("Writing Page 36: Chapter 8.3 & 8.4 - Security and Testing...")
    add_sec_header("8.3 SECURITY AND AUTHENTICATION", space_before=4, space_after=2)
    add_para(
        "Security and data integrity are fundamental to ClimaShield TN, ensuring system availability during critical disaster scenarios. "
        "User passwords are encrypted using Bcrypt with an adaptive work factor (10 rounds) prior to database persistence. Following successful "
        "authentication, the server generates a cryptographically signed JSON Web Token (JWT) containing the user's identifier and assigned role. "
        "Tokens are transmitted via HTTP Authorization Bearer headers and validated on every protected API endpoint.",
        space_after=4
    )

    add_para(
        "The platform enforces strict Role-Based Access Control (RBAC). Endpoints handling incident triage and alert broadcasting require ADMIN or "
        "DISTRICT_OFFICER privileges, while public citizens are restricted to personal profile updates and report submissions. All database queries "
        "utilize parameterized SQL statements through node-postgres, preventing SQL injection vulnerabilities. Cross-Origin Resource Sharing (CORS) "
        "policies restrict API access to verified client domains, while input sanitization pipelines validate all incoming GPS coordinates and payloads.",
        space_after=6
    )

    add_sec_header("8.4 TESTING AND VERIFICATION", space_before=4, space_after=2)
    add_para(
        "ClimaShield TN includes an automated integration test suite built with Jest and Supertest that validates backend functionality against "
        "the live database. The test suite exercises both core and edge-case execution paths across the application:",
        space_after=4
    )

    add_bullet(
        "Health & System Status Checks: Validates that GET /api/health returns a 200 OK status and verifies that GET /api/v1/system/status confirms "
        "active database connectivity and complete data seeding (8 districts, 11 shelters, 3,360 climate records).",
        bold_prefix="• ", space_after=2
    )
    add_bullet(
        "Historical Climate Series Validation: Verifies that GET /api/v1/climate/historical returns annual aggregates with validated numeric types "
        "for mean temperatures and rainfall across specified year intervals.",
        bold_prefix="• ", space_after=2
    )
    add_bullet(
        "PostGIS Geodesic Distance Verification: Tests the GET /api/v1/shelters/nearby endpoint with coordinate parameters (lat=13.0827, lon=80.2707, "
        "radius_km=25), confirming candidate shelters are returned with validated numeric distance_km fields. Validates that requests missing coordinate "
        "parameters are rejected with a 400 Bad Request error.",
        bold_prefix="• ", space_after=2
    )
    add_bullet(
        "Frontend Integration Testing: Verifies through Playwright end-to-end automation that all 10+ page routes render correctly under both "
        "Citizen and Admin sessions without runtime console exceptions.",
        bold_prefix="• ", space_after=2
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 37: CHAPTER 9 - CONCLUSION (Footer = 36)
    # ---------------------------------------------------------------------------
    print("Writing Page 37: Chapter 9 - Conclusion...")
    add_chapter_header("9", "CONCLUSION")

    add_para(
        "ClimaShield TN provides a modern, scalable, and practical technological solution for climate monitoring and disaster resilience in "
        "Tamil Nadu. By replacing fragmented, manual communication workflows with an integrated geospatial platform, the system establishes a "
        "direct digital link between public citizens experiencing emergencies on the ground and administrative command centers coordinating "
        "statewide relief operations. The enforcement of clear Role-Based Access Control ensures that citizens receive rapid shelter guidance, "
        "district officers maintain organized triage queues, and state administrators have comprehensive situational visibility across all 38 districts."
    )

    add_para(
        "The integration of PostgreSQL PostGIS spatial indexing, the geodesic ST_DWithin proximity routing engine, the server-enforced incident "
        "verification state machine, the 35-year Disaster Time Machine, the interactive Disaster Impact Simulator, and the bilingual Emergency AI Assistant "
        "elevate ClimaShield TN beyond simple data tracking into an active decision-support system. The platform maintains accurate spatial records, "
        "accelerates emergency response times, mitigates misinformation through verified triage, and empowers community resilience."
    )

    add_para(
        "While ClimaShield TN successfully meets all of its core design objectives, future enhancements could expand its operational capabilities. "
        "Planned extensions include integrating IoT water-level sensor telemetry deployed along the Adyar and Cooum rivers, incorporating synthetic "
        "aperture radar (SAR) satellite imagery for automated flood inundation mapping, and deploying an offline Progressive Web App (PWA) with "
        "background synchronization for environments with compromised cellular connectivity. Overall, ClimaShield TN demonstrates how modern web "
        "technologies can be harnessed to protect lives and build climate resilience across Tamil Nadu."
    )

    doc.add_page_break()

    # ---------------------------------------------------------------------------
    # PAGE 38: CHAPTER 10 - REFERENCES (Footer = 37)
    # ---------------------------------------------------------------------------
    print("Writing Page 38: Chapter 10 - References...")
    add_chapter_header("10", "REFERENCES", space_before=10, space_after=10)

    references = [
        "Tamil Nadu State Disaster Management Authority (TNSDMA). (2023). State Disaster Management Plan for Tamil Nadu. Revenue and Disaster Management Department, Government of Tamil Nadu.",
        "Intergovernmental Panel on Climate Change (IPCC). (2023). Climate Change 2023: Synthesis Report. Contribution of Working Groups I, II and III to the Sixth Assessment Report of the IPCC, Geneva, Switzerland.",
        "Open Geospatial Consortium (OGC). (2010). OpenGIS Implementation Standard for Geographic information - Simple feature access - Part 1: Common architecture. OGC Document 06-103r4.",
        "Ramsey, P., & Neufeld, R. (2024). PostGIS Manual: Spatial and Geographic Objects for PostgreSQL (Version 3.4). Creative Commons Share Alike.",
        "Facebook Open Source. (2024). React 18 Documentation: Building Reactive User Interfaces. Meta Platforms, Inc.",
        "Vite Core Team. (2024). Vite: Next Generation Frontend Tooling. Available at: https://vite.dev/guide/",
        "Modulz. (2023). Stitches: Near-Zero Runtime CSS-in-JS with Near-Zero Setup. Available at: https://stitches.dev/",
        "Agafonkin, V. (2024). Leaflet: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps. Available at: https://leafletjs.com/",
        "Bostock, M. (2023). D3: Data-Driven Documents. Available at: https://d3js.org/",
        "OpenWeather Ltd. (2024). OpenWeatherMap Current Weather Data API Documentation. Available at: https://openweathermap.org/api",
        "RainViewer Team. (2024). RainViewer Free Weather Radar API: Real-Time Precipitation Tile Services. Available at: https://www.rainviewer.com/api.html",
        "Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT). RFC 7519, Internet Engineering Task Force (IETF).",
        "Rescorla, E. (2018). The Transport Layer Security (TLS) Protocol Version 1.3. RFC 8446, Internet Engineering Task Force (IETF).",
        "Indian Meteorological Department (IMD). (2023). Standard Operating Procedure for Cyclone Warning Services in India. Ministry of Earth Sciences, Government of India."
    ]

    for ref in references:
        add_bullet(ref, bold_prefix="• ", space_before=1.5, space_after=3, size=11, line_spacing=1.1)

    output_filename = "ClimaShield_TN_Project_Report.docx"
    doc.save(output_filename)
    print(f"✅ Calibrated 38-page report saved successfully to {output_filename}!")

if __name__ == '__main__':
    create_report()
