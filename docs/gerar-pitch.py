"""
Gera a apresentacao comercial (pitch deck) do FinApp em PowerPoint.
Visual moderno, dados reais, narrativa persuasiva.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Cm, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn, nsmap
import os

# ── Cores do tema ──────────────────────────────────────────────
EMERALD_600 = RGBColor(0x05, 0x96, 0x69)
EMERALD_500 = RGBColor(0x10, 0xB9, 0x81)
EMERALD_400 = RGBColor(0x34, 0xD3, 0x99)
EMERALD_100 = RGBColor(0xD1, 0xFA, 0xE5)
EMERALD_50  = RGBColor(0xEC, 0xFD, 0xF5)

SLATE_900   = RGBColor(0x0F, 0x17, 0x2A)
SLATE_800   = RGBColor(0x1E, 0x29, 0x3B)
SLATE_700   = RGBColor(0x33, 0x41, 0x55)
SLATE_600   = RGBColor(0x47, 0x55, 0x69)
SLATE_500   = RGBColor(0x64, 0x74, 0x8B)
SLATE_400   = RGBColor(0x94, 0xA3, 0xB8)
SLATE_300   = RGBColor(0xCB, 0xD5, 0xE1)
SLATE_200   = RGBColor(0xE2, 0xE8, 0xF0)
SLATE_100   = RGBColor(0xF1, 0xF5, 0xF9)
SLATE_50    = RGBColor(0xF8, 0xFA, 0xFC)
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)

ROSE_500    = RGBColor(0xF4, 0x3F, 0x5E)
ROSE_100    = RGBColor(0xFF, 0xE4, 0xE6)
AMBER_500   = RGBColor(0xF5, 0x9E, 0x0B)
AMBER_100   = RGBColor(0xFE, 0xF3, 0xC7)
BLUE_500    = RGBColor(0x3B, 0x82, 0xF6)
BLUE_100    = RGBColor(0xDB, 0xEA, 0xFE)

FONT_MAIN   = "Segoe UI"
FONT_TITLE  = "Segoe UI"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


def set_slide_bg(slide, color):
    """Set solid background color for a slide."""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_shape(slide, left, top, width, height, fill_color, border_color=None, border_width=Pt(0)):
    """Add a rectangle shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = border_width
    else:
        shape.line.fill.background()
    return shape


def add_rounded_rect(slide, left, top, width, height, fill_color, border_color=None):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape


def add_text_box(slide, left, top, width, height, text, font_size=Pt(14),
                 color=SLATE_700, bold=False, alignment=PP_ALIGN.LEFT,
                 font_name=FONT_MAIN, line_spacing=None, anchor=MSO_ANCHOR.TOP):
    """Add a text box with styled text."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.auto_size = None

    p = tf.paragraphs[0]
    p.text = text
    p.font.size = font_size
    p.font.color.rgb = color
    p.font.name = font_name
    p.font.bold = bold
    p.alignment = alignment
    if line_spacing:
        p.line_spacing = line_spacing

    # Vertical anchor
    bodyPr = tf._txBody.find(qn("a:bodyPr"))
    if anchor == MSO_ANCHOR.MIDDLE:
        bodyPr.set("anchor", "ctr")
    elif anchor == MSO_ANCHOR.BOTTOM:
        bodyPr.set("anchor", "b")

    return txBox


def add_multiline_text(slide, left, top, width, height, lines, default_size=Pt(14),
                       default_color=SLATE_700, alignment=PP_ALIGN.LEFT,
                       line_spacing=None, anchor=MSO_ANCHOR.TOP):
    """Add text box with multiple styled paragraphs.
    lines = [(text, {font_size, color, bold, ...}), ...]
    """
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.auto_size = None

    bodyPr = tf._txBody.find(qn("a:bodyPr"))
    if anchor == MSO_ANCHOR.MIDDLE:
        bodyPr.set("anchor", "ctr")

    for i, (text, style) in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()

        p.text = text
        p.font.size = style.get("size", default_size)
        p.font.color.rgb = style.get("color", default_color)
        p.font.name = style.get("font", FONT_MAIN)
        p.font.bold = style.get("bold", False)
        p.alignment = style.get("alignment", alignment)
        if style.get("space_before"):
            p.space_before = style["space_before"]
        if style.get("space_after"):
            p.space_after = style["space_after"]
        if line_spacing:
            p.line_spacing = line_spacing

    return txBox


def add_stat_card(slide, left, top, width, height, number, label, accent_color,
                  bg_color=WHITE, number_size=Pt(36)):
    """Add a statistics card with large number and label."""
    card = add_rounded_rect(slide, left, top, width, height, bg_color, border_color=SLATE_200)

    # Accent bar at top
    bar = add_shape(slide, left + Inches(0.3), top + Inches(0.2),
                    Inches(0.6), Pt(4), accent_color)

    # Number
    add_text_box(slide, left + Inches(0.3), top + Inches(0.45),
                 width - Inches(0.6), Inches(0.8),
                 number, font_size=number_size, color=accent_color, bold=True)

    # Label
    add_text_box(slide, left + Inches(0.3), top + height - Inches(1.0),
                 width - Inches(0.6), Inches(0.8),
                 label, font_size=Pt(13), color=SLATE_600,
                 line_spacing=Pt(18))


def add_feature_card(slide, left, top, width, height, icon_text, title, description,
                     accent_color=EMERALD_600):
    """Add a feature highlight card."""
    card = add_rounded_rect(slide, left, top, width, height, WHITE, border_color=SLATE_200)

    # Icon circle
    icon_size = Inches(0.55)
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                     left + Inches(0.3), top + Inches(0.25),
                                     icon_size, icon_size)
    circle.fill.solid()
    circle.fill.fore_color.rgb = EMERALD_50
    circle.line.fill.background()

    add_text_box(slide, left + Inches(0.3), top + Inches(0.27),
                 icon_size, icon_size,
                 icon_text, font_size=Pt(20), color=accent_color,
                 bold=True, alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Title
    add_text_box(slide, left + Inches(0.3), top + Inches(0.9),
                 width - Inches(0.6), Inches(0.35),
                 title, font_size=Pt(15), color=SLATE_900, bold=True)

    # Description
    add_text_box(slide, left + Inches(0.3), top + Inches(1.25),
                 width - Inches(0.6), height - Inches(1.5),
                 description, font_size=Pt(11.5), color=SLATE_600,
                 line_spacing=Pt(17))


def add_check_list(slide, left, top, width, items, color=EMERALD_600):
    """Add a checklist with green checkmarks."""
    txBox = slide.shapes.add_textbox(left, top, width, Inches(len(items) * 0.45))
    tf = txBox.text_frame
    tf.word_wrap = True

    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        # Checkmark
        run = p.add_run("\u2713  ")
        run.font.size = Pt(14)
        run.font.color.rgb = color
        run.font.bold = True
        run.font.name = FONT_MAIN
        # Text
        run = p.add_run(item)
        run.font.size = Pt(14)
        run.font.color.rgb = SLATE_700
        run.font.name = FONT_MAIN
        p.space_after = Pt(8)

    return txBox


def add_comparison_row(slide, top, feature, competitors_status, finapp_status):
    """Add a row in the comparison table."""
    left_start = Inches(0.8)
    row_h = Inches(0.48)

    # Feature name
    add_text_box(slide, left_start, top, Inches(3.2), row_h,
                 feature, font_size=Pt(12), color=SLATE_700, anchor=MSO_ANCHOR.MIDDLE)

    # Competitor status
    add_text_box(slide, left_start + Inches(3.4), top, Inches(4.5), row_h,
                 competitors_status, font_size=Pt(11), color=SLATE_500,
                 alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # FinApp status
    shape = add_shape(slide, left_start + Inches(8.1), top,
                      Inches(3.2), row_h, EMERALD_50)
    shape.line.fill.background()
    add_text_box(slide, left_start + Inches(8.1), top, Inches(3.2), row_h,
                 finapp_status, font_size=Pt(12), color=EMERALD_600,
                 bold=True, alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


# ═══════════════════════════════════════════════════════════════
# SLIDES
# ═══════════════════════════════════════════════════════════════

def build_presentation():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    blank_layout = prs.slide_layouts[6]  # blank

    # ──────────────────────────────────────────────────────────
    # SLIDE 1 — CAPA
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_900)

    # Accent stripe left
    add_shape(slide, Inches(0), Inches(0), Inches(0.12), SLIDE_H, EMERALD_600)

    # Decorative circles
    c1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.5), Inches(-1), Inches(4), Inches(4))
    c1.fill.solid()
    c1.fill.fore_color.rgb = SLATE_800
    c1.line.fill.background()

    c2 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.5), Inches(5), Inches(3.5), Inches(3.5))
    c2.fill.solid()
    c2.fill.fore_color.rgb = SLATE_800
    c2.line.fill.background()

    # Logo
    add_text_box(slide, Inches(1.2), Inches(1.8), Inches(5), Inches(1),
                 "FinApp", font_size=Pt(56), color=EMERALD_500, bold=True)

    # Tagline
    add_text_box(slide, Inches(1.2), Inches(3.0), Inches(7), Inches(0.8),
                 "Gestao financeira pessoal inteligente.",
                 font_size=Pt(26), color=WHITE)

    # Subtitle
    add_text_box(slide, Inches(1.2), Inches(3.8), Inches(8), Inches(0.7),
                 "Controle completo. Projecoes reais. Assistente com IA.",
                 font_size=Pt(16), color=SLATE_400)

    # Bottom bar
    add_shape(slide, Inches(1.2), Inches(5.8), Inches(1.5), Pt(3), EMERALD_600)
    add_text_box(slide, Inches(1.2), Inches(6.1), Inches(5), Inches(0.5),
                 "Fevereiro 2026", font_size=Pt(12), color=SLATE_500)

    # ──────────────────────────────────────────────────────────
    # SLIDE 2 — O PROBLEMA (CHOQUE)
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, WHITE)

    # Section label
    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "O CENARIO ATUAL", font_size=Pt(11), color=EMERALD_600, bold=True)

    # Headline
    add_multiline_text(slide, Inches(0.8), Inches(1.0), Inches(11), Inches(1.5),
        [
            ("Metade do Brasil esta no vermelho.", {"size": Pt(36), "color": SLATE_900, "bold": True}),
        ]
    )

    # Subtitle
    add_text_box(slide, Inches(0.8), Inches(2.2), Inches(10), Inches(0.7),
                 "81,2 milhoes de brasileiros estao inadimplentes — recorde historico.",
                 font_size=Pt(18), color=SLATE_600)

    # Stats cards
    card_y = Inches(3.5)
    card_w = Inches(3.6)
    card_h = Inches(3.0)
    gap = Inches(0.5)

    add_stat_card(slide, Inches(0.8), card_y, card_w, card_h,
                  "48%", "dos brasileiros\nnao controlam o\nproprio orcamento",
                  ROSE_500, number_size=Pt(48))

    add_stat_card(slide, Inches(0.8) + card_w + gap, card_y, card_w, card_h,
                  "R$ 518 bi", "em dividas acumuladas\npelos inadimplentes\nem dezembro de 2025",
                  AMBER_500, number_size=Pt(40))

    add_stat_card(slide, Inches(0.8) + 2*(card_w + gap), card_y, card_w, card_h,
                  "77,5%", "das familias\nbrasileiras estao\nendividadas",
                  BLUE_500, number_size=Pt(48))

    # Source
    add_text_box(slide, Inches(0.8), Inches(6.8), Inches(10), Inches(0.4),
                 "Fontes: Serasa (Dez/2025), CNDL/SPC Brasil, CNC/Agencia Brasil",
                 font_size=Pt(9), color=SLATE_400)

    # ──────────────────────────────────────────────────────────
    # SLIDE 3 — POR QUE NAO CONTROLAM
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_50)

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "A RAIZ DO PROBLEMA", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(1),
                 "Por que as pessoas nao controlam suas financas?",
                 font_size=Pt(32), color=SLATE_900, bold=True)

    # Reason cards - 2x2 grid
    reasons = [
        ("\u2716", "Nao sabem como",
         "19% dos jovens dizem nao saber por onde comecar. Falta educacao financeira — 55% entendem pouco ou nada sobre o tema.",
         ROSE_500),
        ("\u23F3", "Falta de disciplina",
         "Registrar gastos manualmente e tedioso. A maioria desiste em poucas semanas. 36% dos que tentam usam caderno de papel.",
         AMBER_500),
        ("\u2699", "Ferramentas complexas",
         "Apps com muitos menus, configuracoes confusas e funcionalidades fragmentadas. Investimentos num app, gastos em outro, projecoes numa planilha.",
         BLUE_500),
        ("\u20AB", "Ferramentas caras",
         "Organizze cobra R$ 35/mes so para controle manual. Mobills exige plano PRO para IA. Funcionalidades essenciais atras de paywall.",
         SLATE_600),
    ]

    card_w = Inches(5.5)
    card_h = Inches(1.8)
    start_x = Inches(0.8)
    start_y = Inches(2.5)
    gap_x = Inches(0.6)
    gap_y = Inches(0.5)

    for i, (icon, title, desc, accent) in enumerate(reasons):
        col = i % 2
        row = i // 2
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        card = add_rounded_rect(slide, x, y, card_w, card_h, WHITE, border_color=SLATE_200)

        # Icon
        add_text_box(slide, x + Inches(0.25), y + Inches(0.25),
                     Inches(0.5), Inches(0.5),
                     icon, font_size=Pt(20), color=accent, bold=True)

        # Title
        add_text_box(slide, x + Inches(0.85), y + Inches(0.22),
                     card_w - Inches(1.1), Inches(0.4),
                     title, font_size=Pt(16), color=SLATE_900, bold=True)

        # Description
        add_text_box(slide, x + Inches(0.85), y + Inches(0.65),
                     card_w - Inches(1.1), card_h - Inches(0.9),
                     desc, font_size=Pt(12), color=SLATE_600, line_spacing=Pt(17))

    add_text_box(slide, Inches(0.8), Inches(6.85), Inches(10), Inches(0.4),
                 "Fontes: CNDL/SPC Brasil, FEBRABAN",
                 font_size=Pt(9), color=SLATE_400)

    # ──────────────────────────────────────────────────────────
    # SLIDE 4 — CONCORRENTES FALHAM
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, WHITE)

    add_text_box(slide, Inches(0.8), Inches(0.4), Inches(3), Inches(0.4),
                 "O MERCADO HOJE", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(0.85), Inches(11), Inches(0.6),
                 "As ferramentas existentes nao resolvem o problema completo.",
                 font_size=Pt(28), color=SLATE_900, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.55), Inches(10), Inches(0.5),
                 "Cada uma ataca um pedaco — nenhuma oferece a visao integrada que o usuario precisa.",
                 font_size=Pt(14), color=SLATE_500)

    # Competitor cards
    competitors = [
        ("Mobills", "IA apenas via WhatsApp\n(plano PRO). Investimentos\nem app separado.",
         "A partir de R$ 8/mes"),
        ("Organizze", "Sem IA. Sem investimentos.\nSem plano gratuito.\nInterface datada.",
         "R$ 35/mes (manual)"),
        ("GuiaBolso", "Descontinuado em 2022.\nUsuarios perderam dados.\nConfianca comprometida.",
         "Encerrado"),
        ("Minhas\nEconomias", "Interface desatualizada.\nInstabilidade frequente.\nSem IA nem projecao real.",
         "Gratuito (limitado)"),
    ]

    card_w = Inches(2.75)
    card_h = Inches(3.2)
    start_x = Inches(0.8)
    start_y = Inches(2.4)
    gap = Inches(0.35)

    for i, (name, issues, price) in enumerate(competitors):
        x = start_x + i * (card_w + gap)

        card = add_rounded_rect(slide, x, start_y, card_w, card_h, SLATE_50,
                                border_color=SLATE_200)

        # Name
        add_text_box(slide, x + Inches(0.25), start_y + Inches(0.25),
                     card_w - Inches(0.5), Inches(0.7),
                     name, font_size=Pt(18), color=SLATE_900, bold=True)

        # Issues
        add_text_box(slide, x + Inches(0.25), start_y + Inches(1.0),
                     card_w - Inches(0.5), Inches(1.4),
                     issues, font_size=Pt(12), color=SLATE_600, line_spacing=Pt(17))

        # Price tag
        add_text_box(slide, x + Inches(0.25), start_y + card_h - Inches(0.6),
                     card_w - Inches(0.5), Inches(0.4),
                     price, font_size=Pt(11), color=ROSE_500, bold=True)

    # ──────────────────────────────────────────────────────────
    # SLIDE 5 — COMPARACAO DETALHADA
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, WHITE)

    add_text_box(slide, Inches(0.8), Inches(0.35), Inches(3), Inches(0.4),
                 "COMPARATIVO", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(0.75), Inches(10), Inches(0.6),
                 "FinApp vs. concorrentes: funcionalidade por funcionalidade.",
                 font_size=Pt(26), color=SLATE_900, bold=True)

    # Table header
    header_y = Inches(1.6)
    left_start = Inches(0.8)

    # Header background
    add_shape(slide, left_start, header_y, Inches(11.5), Inches(0.5), SLATE_900)
    add_text_box(slide, left_start, header_y, Inches(3.2), Inches(0.5),
                 "  Funcionalidade", font_size=Pt(12), color=WHITE, bold=True,
                 anchor=MSO_ANCHOR.MIDDLE)
    add_text_box(slide, left_start + Inches(3.4), header_y, Inches(4.5), Inches(0.5),
                 "Concorrentes", font_size=Pt(12), color=SLATE_400, bold=True,
                 alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text_box(slide, left_start + Inches(8.1), header_y, Inches(3.2), Inches(0.5),
                 "FinApp", font_size=Pt(12), color=EMERALD_400, bold=True,
                 alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Table rows
    rows_data = [
        ("Plano gratuito completo",     "Limitado ou inexistente",              "\u2713  Sim, completo"),
        ("Assistente com IA",           "Apenas Mobills (WhatsApp, plano PRO)", "\u2713  Integrado (Gemini)"),
        ("Importacao OFX/CSV/PDF",      "Mobills e Organizze (pagos, so OFX)", "\u2713  3 formatos + IA"),
        ("KPIs e alertas inteligentes", "Ausente ou basico",                   "\u2713  5 KPIs + insights"),
        ("Tetos de orcamento",          "Ausente ou rigido",                   "\u2713  Por categoria"),
        ("Fluxo de caixa projetado",    "Basico ou ausente",                   "\u2713  Diario + Previsto"),
        ("Investimentos integrados",    "Ausente ou em app separado",          "\u2713  CRUD + Evolucao"),
        ("Fechamento mensal guiado",    "Ausente",                             "\u2713  Resumo + sugestoes"),
        ("Deteccao de recorrencias",    "Ausente",                             "\u2713  Automatica"),
        ("Dia de fechamento flexivel",  "Ausente ou nao configuravel",         "\u2713  Dias 1 a 28"),
        ("Plataforma web responsiva",   "Varia (alguns so mobile)",            "\u2713  Web + mobile"),
    ]

    row_y = header_y + Inches(0.55)
    row_h = Inches(0.48)

    for i, (feature, comp, finapp) in enumerate(rows_data):
        y = row_y + i * row_h

        # Alternating background
        if i % 2 == 0:
            add_shape(slide, left_start, y, Inches(7.9), row_h, SLATE_50)
        else:
            add_shape(slide, left_start, y, Inches(7.9), row_h, WHITE)

        # FinApp column always highlighted
        finapp_bg = EMERALD_50 if i % 2 == 0 else RGBColor(0xF0, 0xFD, 0xF4)
        add_shape(slide, left_start + Inches(8.1), y, Inches(3.2), row_h, finapp_bg)

        add_text_box(slide, left_start + Inches(0.15), y, Inches(3.0), row_h,
                     feature, font_size=Pt(11.5), color=SLATE_700, anchor=MSO_ANCHOR.MIDDLE)
        add_text_box(slide, left_start + Inches(3.4), y, Inches(4.5), row_h,
                     comp, font_size=Pt(11), color=SLATE_500,
                     alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_text_box(slide, left_start + Inches(8.1), y, Inches(3.2), row_h,
                     finapp, font_size=Pt(11.5), color=EMERALD_600,
                     bold=True, alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # ──────────────────────────────────────────────────────────
    # SLIDE 6 — APRESENTANDO FINAPP (HERO)
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_900)

    # Accent stripe
    add_shape(slide, Inches(0), Inches(0), Inches(0.12), SLIDE_H, EMERALD_600)

    # Decorative
    c1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10), Inches(1), Inches(4.5), Inches(4.5))
    c1.fill.solid()
    c1.fill.fore_color.rgb = SLATE_800
    c1.line.fill.background()

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "A SOLUCAO", font_size=Pt(11), color=EMERALD_500, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.5), Inches(8), Inches(1.2),
                 "Tudo o que voce precisa.\nEm um unico lugar.",
                 font_size=Pt(40), color=WHITE, bold=True, line_spacing=Pt(52))

    add_text_box(slide, Inches(0.8), Inches(3.3), Inches(8), Inches(0.8),
                 "Contas, transacoes, investimentos, projecoes e um assistente\n"
                 "com inteligencia artificial — integrados numa plataforma moderna e gratuita.",
                 font_size=Pt(17), color=SLATE_400, line_spacing=Pt(26))

    # Feature pills
    pills = ["Controle completo", "Projecao de fluxo", "Investimentos",
             "Assistente IA", "Importacao inteligente", "KPIs e alertas",
             "Tetos de orcamento", "Fechamento mensal", "Deteccao de padroes"]

    pill_y = Inches(4.5)
    pill_x = Inches(0.8)
    for i, pill_text in enumerate(pills):
        col = i % 3
        row = i // 3
        x = pill_x + col * Inches(3.0)
        y = pill_y + row * Inches(0.6)

        pill = add_rounded_rect(slide, x, y, Inches(2.7), Inches(0.48),
                                SLATE_800, border_color=SLATE_700)
        add_text_box(slide, x, y, Inches(2.7), Inches(0.48),
                     "\u2713  " + pill_text, font_size=Pt(12), color=EMERALD_400,
                     bold=True, alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # ──────────────────────────────────────────────────────────
    # SLIDE 7 — FUNCIONALIDADES (6 CARDS)
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_50)

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "FUNCIONALIDADES", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(0.85), Inches(10), Inches(0.6),
                 "Uma plataforma, seis pilares.",
                 font_size=Pt(28), color=SLATE_900, bold=True)

    features = [
        ("$", "Controle Financeiro",
         "Contas, cartoes e carteiras. Transacoes com categorias, filtro mensal e saldo em tempo real."),
        ("\u21C5", "Importacao Inteligente",
         "Importe extratos OFX, CSV ou PDF. PDFs de faturas sao extraidos automaticamente por IA (Gemini). Deteccao de duplicatas e categorizacao automatica."),
        ("\u27F3", "Transacoes Planejadas",
         "Recorrentes, pontuais e com periodo. Deteccao automatica de padroes nos seus gastos para criar recorrentes."),
        ("\u2197", "Fluxo e Orcamento",
         "Fluxo Diario e Previsto. KPIs financeiros, tetos de orcamento por categoria e alertas automaticos."),
        ("\u2261", "Investimentos",
         "Carteira com aportes, resgates e saldos. Evolucao mensal e retorno real descontando inflacao (IPCA)."),
        ("\u2605", "Assistente com IA",
         "Chat com Gemini que analisa seus dados reais. Insights proativos e fechamento mensal guiado."),
    ]

    card_w = Inches(3.7)
    card_h = Inches(2.35)
    gap_x = Inches(0.4)
    gap_y = Inches(0.3)
    start_x = Inches(0.8)
    start_y = Inches(1.65)

    for i, (icon, title, desc) in enumerate(features):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)
        add_feature_card(slide, x, y, card_w, card_h, icon, title, desc)

    # ──────────────────────────────────────────────────────────
    # SLIDE 8 — ASSISTENTE IA (DESTAQUE)
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, WHITE)

    # Left side - dark panel
    add_shape(slide, Inches(0), Inches(0), Inches(6.2), SLIDE_H, SLATE_900)
    add_shape(slide, Inches(0), Inches(0), Inches(0.12), SLIDE_H, EMERALD_600)

    add_text_box(slide, Inches(0.8), Inches(0.8), Inches(4.5), Inches(0.4),
                 "DIFERENCIAL", font_size=Pt(11), color=EMERALD_500, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.5), Inches(5), Inches(1.5),
                 "Um assistente\nque entende\nsuas financas.",
                 font_size=Pt(36), color=WHITE, bold=True, line_spacing=Pt(46))

    add_text_box(slide, Inches(0.8), Inches(3.6), Inches(4.8), Inches(1),
                 "O FinAssist analisa suas contas, transacoes, recorrentes "
                 "e investimentos em tempo real para entregar diagnosticos "
                 "personalizados — nao respostas genericas.",
                 font_size=Pt(14), color=SLATE_400, line_spacing=Pt(22))

    add_text_box(slide, Inches(0.8), Inches(5.0), Inches(4.5), Inches(0.4),
                 "Powered by Gemini 2.5 Flash", font_size=Pt(11),
                 color=SLATE_500)

    # Right side - example questions
    add_text_box(slide, Inches(6.8), Inches(0.8), Inches(5), Inches(0.4),
                 "Pergunte qualquer coisa:", font_size=Pt(14),
                 color=SLATE_500, bold=True)

    questions = [
        "\"Como esta minha saude financeira?\"",
        "\"Minhas despesas estao controladas?\"",
        "\"Minha carteira esta diversificada?\"",
        "\"Quais categorias estouraram o teto?\"",
        "\"Tenho reserva de emergencia suficiente?\"",
        "\"Como posso economizar mais?\"",
    ]

    for i, q in enumerate(questions):
        y = Inches(1.5) + i * Inches(0.85)
        bubble = add_rounded_rect(slide, Inches(6.8), y, Inches(5.5), Inches(0.65),
                                   EMERALD_50, border_color=EMERALD_100)
        add_text_box(slide, Inches(7.1), y, Inches(5), Inches(0.65),
                     q, font_size=Pt(14), color=SLATE_700, anchor=MSO_ANCHOR.MIDDLE)

    # Context note
    add_rounded_rect(slide, Inches(6.8), Inches(6.6), Inches(5.5), Inches(0.55),
                     SLATE_50, border_color=SLATE_200)
    add_text_box(slide, Inches(7.1), Inches(6.6), Inches(5), Inches(0.55),
                 "\u21BB  Mantem o contexto da conversa — faca perguntas de acompanhamento naturalmente.",
                 font_size=Pt(11), color=SLATE_600, anchor=MSO_ANCHOR.MIDDLE)

    # ──────────────────────────────────────────────────────────
    # SLIDE 9 — EVIDENCIA (DADOS)
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_50)

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "A EVIDENCIA", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(0.8),
                 "Controlar financas funciona. Os numeros comprovam.",
                 font_size=Pt(32), color=SLATE_900, bold=True)

    # Evidence cards
    evidence = [
        ("88%", "dos usuarios de apps\nfinanceiros consideram\na ferramenta muito\nou extremamente util",
         EMERALD_600, "Academy Bank Research"),
        ("2,5x", "mais chance de\npoupar o suficiente\npara aposentadoria\ncom planejamento",
         BLUE_500, "Ramsey Solutions"),
        ("+59%", "crescimento em\ninstalacoes de apps\nfinanceiros na\nAmerica Latina (2025)",
         EMERALD_600, "TI Inside / Adjust"),
        ("90%", "dos brasileiros\nadmitem precisar\nde educacao\nfinanceira",
         AMBER_500, "Funpresp-Jud"),
    ]

    card_w = Inches(2.75)
    card_h = Inches(3.3)
    gap = Inches(0.35)
    start_x = Inches(0.8)
    start_y = Inches(2.5)

    for i, (number, label, accent, source) in enumerate(evidence):
        x = start_x + i * (card_w + gap)
        card = add_rounded_rect(slide, x, start_y, card_w, card_h, WHITE, border_color=SLATE_200)

        # Accent bar
        add_shape(slide, x + Inches(0.3), start_y + Inches(0.25),
                  Inches(0.5), Pt(4), accent)

        # Number
        add_text_box(slide, x + Inches(0.3), start_y + Inches(0.55),
                     card_w - Inches(0.6), Inches(0.7),
                     number, font_size=Pt(40), color=accent, bold=True)

        # Label
        add_text_box(slide, x + Inches(0.3), start_y + Inches(1.35),
                     card_w - Inches(0.6), Inches(1.3),
                     label, font_size=Pt(13), color=SLATE_600, line_spacing=Pt(18))

        # Source
        add_text_box(slide, x + Inches(0.3), start_y + card_h - Inches(0.5),
                     card_w - Inches(0.6), Inches(0.35),
                     source, font_size=Pt(9), color=SLATE_400)

    # ──────────────────────────────────────────────────────────
    # SLIDE 10 — MERCADO
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, WHITE)

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "OPORTUNIDADE", font_size=Pt(11), color=EMERALD_600, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.0), Inches(10), Inches(0.8),
                 "Um mercado enorme, com lacunas claras.",
                 font_size=Pt(32), color=SLATE_900, bold=True)

    # Left column - market data
    market_stats = [
        ("USD 21,4 bi", "Mercado global de apps\nfinanceiros em 2025", EMERALD_600),
        ("42 milhoes", "Brasileiros ja usam\nOpen Finance", BLUE_500),
        ("44%", "Dos bancarizados se veem\ngerindo financas so pelo celular", AMBER_500),
    ]

    for i, (num, label, accent) in enumerate(market_stats):
        y = Inches(2.3) + i * Inches(1.7)
        add_shape(slide, Inches(0.8), y, Pt(4), Inches(1.2), accent)

        add_text_box(slide, Inches(1.2), y, Inches(4.5), Inches(0.6),
                     num, font_size=Pt(30), color=accent, bold=True)
        add_text_box(slide, Inches(1.2), y + Inches(0.55), Inches(4.5), Inches(0.6),
                     label, font_size=Pt(13), color=SLATE_600, line_spacing=Pt(18))

    # Right column - FinApp positioning
    add_rounded_rect(slide, Inches(6.8), Inches(2.3), Inches(5.5), Inches(4.5),
                     SLATE_900)

    add_text_box(slide, Inches(7.3), Inches(2.7), Inches(4.5), Inches(0.5),
                 "FinApp preenche as lacunas:", font_size=Pt(16),
                 color=EMERALD_400, bold=True)

    gaps = [
        "\u2713  Gratuito e completo — sem paywall em funcionalidades essenciais",
        "\u2713  IA integrada no app — nao em canal separado",
        "\u2713  Importacao OFX, CSV e PDF com IA — 3 formatos, nao apenas 1",
        "\u2713  KPIs, tetos e alertas — orcamento ativo, nao passivo",
        "\u2713  Investimentos na mesma plataforma — nao em app a parte",
        "\u2713  Fechamento mensal e deteccao de padroes — inteligencia proativa",
    ]

    for i, gap_text in enumerate(gaps):
        y = Inches(3.35) + i * Inches(0.52)
        add_text_box(slide, Inches(7.3), y, Inches(4.5), Inches(0.5),
                     gap_text, font_size=Pt(12.5), color=WHITE, line_spacing=Pt(17))

    # ──────────────────────────────────────────────────────────
    # SLIDE 11 — POR QUE FINAPP
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, EMERALD_600)

    add_text_box(slide, Inches(0.8), Inches(0.5), Inches(3), Inches(0.4),
                 "RESUMO", font_size=Pt(11), color=EMERALD_100, bold=True)

    add_text_box(slide, Inches(0.8), Inches(1.2), Inches(10), Inches(1),
                 "Por que FinApp?",
                 font_size=Pt(40), color=WHITE, bold=True)

    # 3 pillars
    pillars = [
        ("Completo", "Contas + Transacoes + Recorrentes +\nInvestimentos + Fluxo + IA\nImportacao OFX, CSV e PDF\n\nTudo integrado, sem fragmentacao.\nSem precisar de 3 apps diferentes."),
        ("Inteligente", "Assistente IA com dados reais.\n5 KPIs, insights proativos,\ntetos de orcamento e alertas.\nDeteccao de recorrencias e\nfechamento mensal guiado."),
        ("Acessivel", "Interface moderna e intuitiva.\nGratuito e sem paywall.\n\nFuncionalidades que custam\nR$ 35/mes em outros apps."),
    ]

    card_w = Inches(3.6)
    card_h = Inches(3.5)
    gap = Inches(0.45)
    start_x = Inches(0.8)
    start_y = Inches(2.8)

    for i, (title, desc) in enumerate(pillars):
        x = start_x + i * (card_w + gap)
        card = add_rounded_rect(slide, x, start_y, card_w, card_h,
                                RGBColor(0x04, 0x7D, 0x57))  # slightly darker emerald
        card.line.fill.background()

        add_text_box(slide, x + Inches(0.4), start_y + Inches(0.35),
                     card_w - Inches(0.8), Inches(0.5),
                     title, font_size=Pt(22), color=WHITE, bold=True)

        add_shape(slide, x + Inches(0.4), start_y + Inches(0.95),
                  Inches(0.8), Pt(3), EMERALD_400)

        add_text_box(slide, x + Inches(0.4), start_y + Inches(1.2),
                     card_w - Inches(0.8), card_h - Inches(1.5),
                     desc, font_size=Pt(13), color=EMERALD_100,
                     line_spacing=Pt(19))

    # ──────────────────────────────────────────────────────────
    # SLIDE 12 — ENCERRAMENTO / CTA
    # ──────────────────────────────────────────────────────────
    slide = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide, SLATE_900)

    add_shape(slide, Inches(0), Inches(0), Inches(0.12), SLIDE_H, EMERALD_600)

    # Decorative
    c1 = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9), Inches(3), Inches(5), Inches(5))
    c1.fill.solid()
    c1.fill.fore_color.rgb = SLATE_800
    c1.line.fill.background()

    add_text_box(slide, Inches(0.8), Inches(2.0), Inches(10), Inches(1.2),
                 "Assuma o controle\ndas suas financas.",
                 font_size=Pt(44), color=WHITE, bold=True, line_spacing=Pt(56))

    add_text_box(slide, Inches(0.8), Inches(3.8), Inches(8), Inches(0.6),
                 "Comece hoje. E gratuito.",
                 font_size=Pt(22), color=EMERALD_400)

    # CTA button
    btn = add_rounded_rect(slide, Inches(0.8), Inches(5.0), Inches(3.5), Inches(0.75),
                            EMERALD_600)
    add_text_box(slide, Inches(0.8), Inches(5.0), Inches(3.5), Inches(0.75),
                 "Conheca o FinApp  \u2192", font_size=Pt(18), color=WHITE,
                 bold=True, alignment=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Footer
    add_shape(slide, Inches(0.8), Inches(6.4), Inches(1.2), Pt(2), EMERALD_600)
    add_text_box(slide, Inches(0.8), Inches(6.6), Inches(6), Inches(0.5),
                 "FinApp  |  Gestao Financeira Pessoal  |  2026",
                 font_size=Pt(11), color=SLATE_500)

    # ── Save ───────────────────────────────────────────────────
    output_path = os.path.join(os.path.dirname(__file__), "FinApp - Pitch Deck.pptx")
    prs.save(output_path)
    print(f"Apresentacao gerada: {output_path}")


if __name__ == "__main__":
    build_presentation()
