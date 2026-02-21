"""
Gera o Manual do Usuario do FinApp em formato Word (.docx)
com formatacao profissional e visual moderno.
"""

from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import re
import os

# ── Cores do tema ──────────────────────────────────────────────
EMERALD_600 = RGBColor(0x05, 0x96, 0x69)
EMERALD_50  = "E6F7F0"
SLATE_900   = RGBColor(0x0F, 0x17, 0x2A)
SLATE_700   = RGBColor(0x33, 0x41, 0x55)
SLATE_500   = RGBColor(0x64, 0x74, 0x8B)
SLATE_200   = "E2E8F0"
SLATE_100   = "F1F5F9"
SLATE_50    = "F8FAFC"
WHITE       = "FFFFFF"
ROSE_50     = "FFF1F2"
AMBER_50    = "FFFBEB"

FONT_BODY   = "Segoe UI"
FONT_TITLE  = "Segoe UI"
FONT_MONO   = "Cascadia Code"


def set_cell_shading(cell, color_hex):
    """Apply background shading to a table cell."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>')
    cell._tc.get_or_add_tcPr().append(shading)


def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Set borders on a cell. Each border is a dict: {sz, color, val}."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    borders = tcPr.find(qn("w:tcBorders"))
    if borders is None:
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
        tcPr.append(borders)
    for edge, data in [("top", top), ("bottom", bottom), ("left", left), ("right", right)]:
        if data:
            el = parse_xml(
                f'<w:{edge} {nsdecls("w")} w:val="{data.get("val","single")}" '
                f'w:sz="{data.get("sz","4")}" w:space="0" '
                f'w:color="{data.get("color","E2E8F0")}"/>'
            )
            existing = borders.find(qn(f"w:{edge}"))
            if existing is not None:
                borders.remove(existing)
            borders.append(el)


def set_table_borders(table, color="E2E8F0", sz="4"):
    """Set outer + inner borders on the whole table."""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else parse_xml(f'<w:tblPr {nsdecls("w")}/>')
    borders_xml = (
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    existing = tblPr.find(qn("w:tblBorders"))
    if existing is not None:
        tblPr.remove(existing)
    tblPr.append(parse_xml(borders_xml))


def remove_paragraph_spacing(paragraph):
    """Remove space before/after a paragraph."""
    pPr = paragraph._p.get_or_add_pPr()
    spacing = pPr.find(qn("w:spacing"))
    if spacing is None:
        spacing = parse_xml(f'<w:spacing {nsdecls("w")} w:before="0" w:after="0"/>')
        pPr.append(spacing)
    else:
        spacing.set(qn("w:before"), "0")
        spacing.set(qn("w:after"), "0")


def add_formatted_text(paragraph, text, bold=False, italic=False, color=None, size=None, font=None):
    """Add a run with optional formatting."""
    run = paragraph.add_run(text)
    run.font.name = font or FONT_BODY
    if size:
        run.font.size = size
    if bold:
        run.bold = True
    if italic:
        run.italic = True
    if color:
        run.font.color.rgb = color
    return run


def write_rich_text(paragraph, text, base_size=Pt(10), base_color=SLATE_700, base_font=FONT_BODY):
    """Parse inline markdown (**bold**, *italic*, `code`) and write runs."""
    # Split by bold, italic, and code patterns
    parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)', text)
    for part in parts:
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.font.name = base_font
            run.font.size = base_size
            run.font.color.rgb = SLATE_900
            run.bold = True
        elif part.startswith("*") and part.endswith("*") and not part.startswith("**"):
            run = paragraph.add_run(part[1:-1])
            run.font.name = base_font
            run.font.size = base_size
            run.font.color.rgb = base_color
            run.italic = True
        elif part.startswith("`") and part.endswith("`"):
            run = paragraph.add_run(part[1:-1])
            run.font.name = FONT_MONO
            run.font.size = Pt(9)
            run.font.color.rgb = EMERALD_600
        else:
            run = paragraph.add_run(part)
            run.font.name = base_font
            run.font.size = base_size
            run.font.color.rgb = base_color


def add_body_paragraph(doc, text, space_after=Pt(6), space_before=Pt(0)):
    """Add a styled body paragraph with rich text."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = space_after
    p.paragraph_format.space_before = space_before
    p.paragraph_format.line_spacing = Pt(16)
    write_rich_text(p, text)
    return p


def add_callout(doc, text, callout_type="info"):
    """Add a styled callout box (blockquote)."""
    colors = {
        "info":    (EMERALD_50, "059669"),
        "warning": (AMBER_50,   "D97706"),
        "danger":  (ROSE_50,    "E11D48"),
    }
    bg, border_color = colors.get(callout_type, colors["info"])

    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)

    # Background
    set_cell_shading(cell, bg)

    # Left border accent
    border = {"sz": "18", "color": border_color, "val": "single"}
    thin = {"sz": "4", "color": bg, "val": "single"}
    set_cell_borders(cell, top=thin, bottom=thin, right=thin, left=border)

    # Content
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    write_rich_text(p, text, base_size=Pt(9.5), base_color=SLATE_700)

    # Spacing after callout
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(2)
    spacer.paragraph_format.space_after = Pt(2)


def add_styled_table(doc, headers, rows, step_table=False):
    """Add a professionally styled table."""
    num_cols = len(headers)
    table = doc.add_table(rows=1 + len(rows), cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True

    # Set table width to 100%
    tbl = table._tbl
    tblPr = tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:type="pct" w:w="5000"/>')
        tblPr.append(tblW)
    else:
        tblW.set(qn("w:type"), "pct")
        tblW.set(qn("w:w"), "5000")

    set_table_borders(table, color="CBD5E1", sz="4")

    # Header row
    for i, header_text in enumerate(headers):
        cell = table.cell(0, i)
        set_cell_shading(cell, "0F172A")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        remove_paragraph_spacing(p)
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(5)
        run = p.add_run(header_text)
        run.font.name = FONT_BODY
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.bold = True
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # Data rows
    for r_idx, row_data in enumerate(rows):
        bg = SLATE_50 if r_idx % 2 == 0 else WHITE
        for c_idx, cell_text in enumerate(row_data):
            cell = table.cell(r_idx + 1, c_idx)
            set_cell_shading(cell, bg)
            p = cell.paragraphs[0]
            remove_paragraph_spacing(p)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

            # Center the step number column
            if step_table and c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(cell_text)
                run.font.name = FONT_BODY
                run.font.size = Pt(9.5)
                run.font.color.rgb = EMERALD_600
                run.bold = True
            else:
                write_rich_text(p, cell_text, base_size=Pt(9.5), base_color=SLATE_700)

    # Spacing after table
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(2)
    spacer.paragraph_format.space_after = Pt(6)

    return table


def add_section_heading(doc, text, level=1):
    """Add a styled heading."""
    p = doc.add_paragraph()

    if level == 1:
        # Chapter heading — large, emerald accent bar
        p.paragraph_format.space_before = Pt(28)
        p.paragraph_format.space_after = Pt(4)

        # Add a thin emerald line before the heading
        run = p.add_run(text)
        run.font.name = FONT_TITLE
        run.font.size = Pt(20)
        run.font.color.rgb = SLATE_900
        run.bold = True

        # Add emerald underline bar
        bar = doc.add_paragraph()
        bar.paragraph_format.space_before = Pt(0)
        bar.paragraph_format.space_after = Pt(10)
        bar_table = doc.add_table(rows=1, cols=1)
        bar_table.alignment = WD_TABLE_ALIGNMENT.LEFT
        bar_cell = bar_table.cell(0, 0)
        set_cell_shading(bar_cell, "059669")
        bar_p = bar_cell.paragraphs[0]
        bar_p.paragraph_format.space_before = Pt(0)
        bar_p.paragraph_format.space_after = Pt(0)
        bar_run = bar_p.add_run(" ")
        bar_run.font.size = Pt(2)
        # Set cell/table width
        bar_tbl = bar_table._tbl
        bar_tblPr = bar_tbl.tblPr
        bar_tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:type="dxa" w:w="2160"/>')
        existing_w = bar_tblPr.find(qn("w:tblW"))
        if existing_w is not None:
            bar_tblPr.remove(existing_w)
        bar_tblPr.append(bar_tblW)
        set_table_borders(bar_table, color="059669", sz="0")

        # Remove the empty paragraph created above
        doc._body._body.remove(bar._p)

    elif level == 2:
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.name = FONT_TITLE
        run.font.size = Pt(14)
        run.font.color.rgb = EMERALD_600
        run.bold = True

    elif level == 3:
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = FONT_TITLE
        run.font.size = Pt(11)
        run.font.color.rgb = SLATE_900
        run.bold = True

    return p


def add_cover_page(doc):
    """Create a modern cover page."""
    # Large top spacing
    for _ in range(6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(12)

    # App name
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("FinApp")
    run.font.name = FONT_TITLE
    run.font.size = Pt(48)
    run.font.color.rgb = EMERALD_600
    run.bold = True

    # Subtitle
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    run = p.add_run("Gestao Financeira Pessoal")
    run.font.name = FONT_TITLE
    run.font.size = Pt(18)
    run.font.color.rgb = SLATE_500

    # Divider line
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(20)
    run = p.add_run("____________________")
    run.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
    run.font.size = Pt(14)

    # Document title
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("Manual do Usuario")
    run.font.name = FONT_TITLE
    run.font.size = Pt(26)
    run.font.color.rgb = SLATE_900
    run.bold = True

    # Version info
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    run = p.add_run("Versao 2.0  |  Fevereiro 2026")
    run.font.name = FONT_BODY
    run.font.size = Pt(11)
    run.font.color.rgb = SLATE_500

    # Page break
    doc.add_page_break()


def add_toc_page(doc):
    """Create a table of contents page."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(20)
    run = p.add_run("Sumario")
    run.font.name = FONT_TITLE
    run.font.size = Pt(24)
    run.font.color.rgb = SLATE_900
    run.bold = True

    # Emerald bar
    bar_table = doc.add_table(rows=1, cols=1)
    bar_table.alignment = WD_TABLE_ALIGNMENT.LEFT
    bar_cell = bar_table.cell(0, 0)
    set_cell_shading(bar_cell, "059669")
    bar_p = bar_cell.paragraphs[0]
    bar_p.paragraph_format.space_before = Pt(0)
    bar_p.paragraph_format.space_after = Pt(0)
    bar_run = bar_p.add_run(" ")
    bar_run.font.size = Pt(2)
    bar_tbl = bar_table._tbl
    bar_tblPr = bar_tbl.tblPr
    bar_tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:type="dxa" w:w="1440"/>')
    existing = bar_tblPr.find(qn("w:tblW"))
    if existing is not None:
        bar_tblPr.remove(existing)
    bar_tblPr.append(bar_tblW)
    set_table_borders(bar_table, color="059669", sz="0")

    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(8)

    toc_items = [
        ("1", "Primeiros Passos"),
        ("2", "Navegacao"),
        ("3", "Dashboard"),
        ("4", "Contas"),
        ("5", "Transacoes"),
        ("6", "Transacoes Planejadas (Recorrentes)"),
        ("7", "Fluxo"),
        ("8", "Investimentos"),
        ("9", "Assistente IA"),
        ("10", "Configuracoes"),
        ("11", "Guia de Configuracao Inicial"),
        ("12", "Uso no Dia a Dia"),
    ]

    for num, title in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Cm(0.5)

        run_num = p.add_run(f"{num}   ")
        run_num.font.name = FONT_BODY
        run_num.font.size = Pt(11)
        run_num.font.color.rgb = EMERALD_600
        run_num.bold = True

        run_title = p.add_run(title)
        run_title.font.name = FONT_BODY
        run_title.font.size = Pt(11)
        run_title.font.color.rgb = SLATE_700

    doc.add_page_break()


def build_document():
    """Build the complete Word document."""
    doc = Document()

    # ── Page setup ─────────────────────────────────────────────
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

    # ── Default paragraph style ────────────────────────────────
    style = doc.styles["Normal"]
    style.font.name = FONT_BODY
    style.font.size = Pt(10)
    style.font.color.rgb = SLATE_700
    style.paragraph_format.space_after = Pt(4)

    # ── Cover page ─────────────────────────────────────────────
    add_cover_page(doc)

    # ── Table of contents ──────────────────────────────────────
    add_toc_page(doc)

    # ── Introduction ───────────────────────────────────────────
    add_body_paragraph(
        doc,
        "Bem-vindo ao FinApp, a plataforma de gestao financeira pessoal que "
        "reune suas contas, transacoes, investimentos, projecoes e inteligencia "
        "artificial em um unico lugar. Com alertas inteligentes, indicadores "
        "financeiros e um assistente que entende seus dados reais, o FinApp vai "
        "alem do controle basico. Este manual vai guia-lo por todas as "
        "funcionalidades disponiveis.",
        space_after=Pt(16)
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 1 — PRIMEIROS PASSOS
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "1  Primeiros Passos", level=1)

    add_section_heading(doc, "1.1  Criando sua conta", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Na tela de login, clique em **Criar conta**."],
            ["2", "Preencha **Nome completo**, **Email** e **Senha** (minimo 6 caracteres)."],
            ["3", "Clique em **Criar conta**."],
            ["4", "Acesse seu email e clique no link de confirmacao. Verifique tambem a pasta de spam."],
            ["5", "Volte a tela de login e entre com suas credenciais."],
        ],
        step_table=True
    )

    add_section_heading(doc, "1.2  Login", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Informe seu **Email** e **Senha**."],
            ["2", "Clique em **Entrar**."],
            ["3", "Voce sera direcionado ao Dashboard."],
        ],
        step_table=True
    )

    add_section_heading(doc, "1.3  Logout", level=2)
    add_body_paragraph(doc, "Clique em **Sair** na parte inferior da barra lateral esquerda.")

    # ═══════════════════════════════════════════════════════════
    # SECTION 2 — NAVEGACAO
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "2  Navegacao", level=1)

    add_body_paragraph(
        doc,
        "A barra lateral esquerda (sidebar) e o ponto central de navegacao. "
        "Ela contem oito itens:"
    )

    add_styled_table(doc,
        ["#", "Menu", "Descricao"],
        [
            ["1", "**Dashboard**",      "Visao geral do mes — receitas, despesas, saldo, graficos"],
            ["2", "**Contas**",         "Cadastro de contas bancarias, cartoes e carteiras"],
            ["3", "**Transacoes**",     "Registro e consulta de movimentacoes financeiras"],
            ["4", "**Recorrentes**",    "Transacoes planejadas que se repetem ou tem data futura"],
            ["5", "**Fluxo**",          "Fluxo diario (dia a dia) e fluxo previsto (projecao mensal)"],
            ["6", "**Investimentos**",  "Carteira de investimentos e quadro de evolucao"],
            ["7", "**Assistente IA**",  "Chat inteligente que analisa seus dados financeiros reais"],
            ["8", "**Configuracoes**",  "Dia de fechamento, meta de reserva, categorias e regras de importacao"],
        ],
        step_table=True
    )

    add_section_heading(doc, "Comportamento da sidebar", level=3)
    add_styled_table(doc,
        ["Dispositivo", "Comportamento"],
        [
            ["**Desktop**", "Fixa a esquerda. Pode ser recolhida clicando na seta do topo — quando recolhida, exibe apenas icones. Passe o mouse sobre o icone para ver o nome."],
            ["**Celular**", "Abre como menu lateral ao tocar no icone de menu no topo. Fecha automaticamente ao navegar."],
        ]
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 3 — DASHBOARD
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "3  Dashboard", level=1)

    add_body_paragraph(
        doc,
        "O Dashboard e a tela inicial. Ele apresenta um panorama completo das "
        "suas financas no mes selecionado."
    )

    add_section_heading(doc, "3.1  Saudacao e atalhos rapidos", level=2)
    add_body_paragraph(
        doc,
        "No topo da pagina, uma saudacao personalizada exibe seu nome e a data "
        "atual (ex: *\"Bom dia, Joao! Segunda, 14 de fevereiro\"*)."
    )
    add_body_paragraph(doc, "Logo abaixo, dois botoes de atalho permitem criar transacoes sem sair do Dashboard:")
    add_styled_table(doc,
        ["Botao", "Funcao"],
        [
            ["**+ Receita**", "Abre o formulario para registrar uma nova receita"],
            ["**+ Despesa**", "Abre o formulario para registrar uma nova despesa"],
        ]
    )

    add_section_heading(doc, "3.2  Seletor de mes", level=2)
    add_body_paragraph(
        doc,
        "Use as setas **<** e **>** ao lado do nome do mes para navegar entre "
        "periodos. Todos os dados exibidos no Dashboard refletem o mes selecionado."
    )

    add_section_heading(doc, "3.3  Cards de resumo", level=2)
    add_body_paragraph(doc, "Tres cards destacados no topo mostram os totais do mes:")
    add_styled_table(doc,
        ["Card", "Cor", "O que mostra"],
        [
            ["**Receitas**", "Verde",    "Soma de todas as receitas do mes"],
            ["**Despesas**", "Vermelho", "Soma de todas as despesas do mes"],
            ["**Saldo**",    "Azul (positivo) ou Vermelho (negativo)", "Diferenca entre receitas e despesas"],
        ]
    )

    add_section_heading(doc, "3.4  Indicadores financeiros (KPIs)", level=2)
    add_body_paragraph(doc, "Logo abaixo dos cards de resumo, cinco mini-cards exibem indicadores-chave das suas financas:")
    add_styled_table(doc,
        ["KPI", "O que mostra", "Cores"],
        [
            ["**Taxa de Poupanca**", "Percentual da receita que voce conseguiu poupar no mes", "Verde (>20%), Amarelo (10-20%), Vermelho (<10%)"],
            ["**Runway Financeiro**", "Quantos meses voce consegue manter o padrao de gastos com o saldo atual", "Verde (>6), Amarelo (3-6), Vermelho (<3)"],
            ["**Reserva de Emergencia**", "Quantos meses de despesas a sua reserva cobre, com barra de progresso em relacao a meta", "Verde (meta atingida), Amarelo (>50%), Vermelho (<50%)"],
            ["**Desvio Orcamentario**", "Percentual medio de desvio entre o previsto e o realizado", "Verde (<10%), Amarelo (10-25%), Vermelho (>25%)"],
            ["**% Gasto Fixo**", "Percentual das receitas comprometido com despesas recorrentes", "Verde (<50%), Amarelo (50-70%), Vermelho (>70%)"],
        ]
    )

    add_section_heading(doc, "3.5  Insights proativos", level=2)
    add_body_paragraph(
        doc,
        "O FinApp analisa seus dados e exibe ate dois cards de insights priorizados no Dashboard. "
        "Cada insight tem borda colorida (vermelho para alertas, amarelo para atencao, verde para "
        "pontos positivos) e pode ser dispensado clicando no botao de fechar."
    )
    add_body_paragraph(doc, "Exemplos de insights:")
    add_body_paragraph(doc, '- "Suas despesas com Alimentacao ultrapassaram o teto de R$ 800 este mes"')
    add_body_paragraph(doc, '- "Sua reserva de emergencia cobre apenas 2 meses — a meta e 6 meses"')
    add_body_paragraph(doc, '- "Parabens! Voce poupou 25% da receita este mes"')

    add_section_heading(doc, "3.6  Widgets do Dashboard", level=2)
    add_body_paragraph(doc, "O conteudo principal esta organizado em duas colunas (no desktop):")

    add_section_heading(doc, "Coluna esquerda (maior)", level=3)
    add_styled_table(doc,
        ["Widget", "O que mostra"],
        [
            ["**Previsto vs Realizado**", "Barra de progresso por categoria, comparando o previsto com o realizado. Categorias com teto exibem badge \"Teto: R$ X\". Badges de alerta: **Estourado** (vermelho, >= 100%) e **Atencao** (amarelo, >= 80%). Resumo no topo com totais."],
            ["**Investimentos**", "Saldo total da carteira, retorno nominal do ultimo mes (em R$ e %) e **retorno real** descontando a inflacao (IPCA 12 meses)."],
            ["**Recorrencias Sugeridas**", "Analisa transacoes dos ultimos 3 meses e detecta padroes repetitivos. Exibe ate 3 sugestoes com botao **Criar** que redireciona para o cadastro de recorrentes com dados pre-preenchidos."],
        ]
    )

    add_section_heading(doc, "Coluna direita", level=3)
    add_styled_table(doc,
        ["Widget", "O que mostra"],
        [
            ["**Despesas por Categoria**", "Grafico de barras horizontais com as maiores categorias de despesa do mes. Cada categoria exibe seu icone visual."],
            ["**Ultimas Transacoes**", "Lista das 5 transacoes mais recentes com descricao, data, categoria, conta e valor. Receitas em verde, despesas em vermelho."],
        ]
    )

    add_section_heading(doc, "3.7  Fechamento mensal", level=2)
    add_body_paragraph(
        doc,
        "No topo do Dashboard, o botao **Revisar mes** abre um modal com o fechamento "
        "do mes selecionado. O modal possui tres secoes:"
    )
    add_styled_table(doc,
        ["Secao", "O que mostra"],
        [
            ["**Resumo**", "Total de receitas, despesas, saldo do mes e taxa de poupanca"],
            ["**Top 3 Desvios**", "As tres categorias com maior diferenca entre previsto e realizado"],
            ["**Sugestoes**", "Recomendacoes automaticas baseadas nos desvios identificados"],
        ]
    )
    add_callout(doc, "**Dica:** Use o fechamento mensal como rotina ao final de cada mes para avaliar sua performance financeira e ajustar o planejamento.", "info")

    # ═══════════════════════════════════════════════════════════
    # SECTION 4 — CONTAS
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "4  Contas", level=1)

    add_body_paragraph(
        doc,
        "A pagina de Contas permite gerenciar as contas que representam de "
        "onde sai e para onde vai seu dinheiro."
    )

    add_section_heading(doc, "4.1  Tipos de conta", level=2)
    add_styled_table(doc,
        ["Tipo", "Uso tipico", "Exemplo"],
        [
            ["**Banco**",    "Contas correntes ou poupanca", "Nubank, Itau, Bradesco"],
            ["**Cartao**",   "Cartoes de credito",           "Visa, Mastercard"],
            ["**Carteira**", "Dinheiro em especie",          "Carteira fisica"],
        ]
    )

    add_section_heading(doc, "4.2  Criar uma conta", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Clique em **Nova conta**."],
            ["2", "Preencha o **Nome da conta** e selecione o **Tipo**."],
            ["3", "Clique em **Criar conta**."],
        ],
        step_table=True
    )
    add_body_paragraph(
        doc,
        "A conta e criada com saldo zero. O saldo e atualizado automaticamente "
        "conforme voce registra transacoes."
    )

    add_section_heading(doc, "4.3  Reserva de emergencia", level=2)
    add_body_paragraph(
        doc,
        "Ao criar ou editar uma conta, voce pode marcar a opcao **\"Conta de reserva "
        "de emergencia\"**. Contas marcadas exibem um badge verde \"Reserva\" na lista "
        "e seu saldo e usado no calculo do KPI de Reserva de Emergencia no Dashboard."
    )
    add_callout(
        doc,
        "**Dica:** Marque como reserva apenas contas dedicadas a essa finalidade "
        "(ex: poupanca separada, CDB de liquidez diaria). Isso permite que o FinApp "
        "calcule corretamente quantos meses de despesas voce tem guardados.",
        "info"
    )

    add_section_heading(doc, "4.4  Editar e excluir", level=2)
    add_styled_table(doc,
        ["Acao", "Como fazer"],
        [
            ["Editar",  "Clique no icone de **lapis** na linha da conta."],
            ["Excluir", "Clique no icone de **lixeira**. Uma confirmacao sera solicitada."],
        ]
    )
    add_callout(doc, "**Atencao:** Contas que possuem transacoes vinculadas nao podem ser excluidas. Remova ou reclassifique as transacoes antes.", "warning")

    # ═══════════════════════════════════════════════════════════
    # SECTION 5 — TRANSACOES
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "5  Transacoes", level=1)

    add_body_paragraph(
        doc,
        "A pagina de Transacoes e onde voce registra e consulta todas as "
        "movimentacoes financeiras — receitas e despesas."
    )

    add_section_heading(doc, "5.1  Criar uma transacao", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Clique em **Nova transacao**."],
            ["2", "Preencha o formulario (veja campos abaixo)."],
            ["3", "Clique em **Criar transacao**."],
        ],
        step_table=True
    )

    add_section_heading(doc, "Campos do formulario", level=3)
    add_styled_table(doc,
        ["Campo", "Descricao"],
        [
            ["Tipo",       "Receita ou Despesa"],
            ["Valor (R$)", "Valor da movimentacao"],
            ["Conta",      "Em qual conta ocorreu"],
            ["Categoria",  "Filtrada automaticamente pelo tipo escolhido"],
            ["Descricao",  "Texto livre — ex: \"Supermercado\", \"Salario\""],
            ["Data",       "Dia em que a transacao ocorreu (padrao: hoje)"],
        ]
    )
    add_body_paragraph(doc, "O saldo da conta selecionada e atualizado automaticamente apos a criacao.")

    add_section_heading(doc, "5.2  Filtro por mes", level=2)
    add_body_paragraph(
        doc,
        "Use as setas **<** e **>** para navegar entre os meses. A lista exibe "
        "apenas as transacoes do mes selecionado, ordenadas da mais recente para a mais antiga."
    )

    add_section_heading(doc, "5.3  Editar e excluir", level=2)
    add_styled_table(doc,
        ["Acao", "Como fazer"],
        [
            ["Editar",  "Clique no icone de **lapis** na linha da transacao."],
            ["Excluir", "Clique no icone de **lixeira**. Uma confirmacao sera solicitada."],
        ]
    )

    add_section_heading(doc, "5.4  Importar transacoes", level=2)
    add_body_paragraph(
        doc,
        "O FinApp permite importar transacoes a partir de tres formatos de arquivo: "
        "**OFX/QFX** (extratos bancarios), **CSV** (planilhas) e **PDF** (faturas de cartao). "
        "Na pagina de Transacoes, clique em **Importar** para iniciar."
    )

    add_section_heading(doc, "Formatos aceitos", level=3)
    add_styled_table(doc,
        ["Formato", "Uso tipico", "Limite"],
        [
            ["**.ofx / .qfx**", "Extratos bancarios padrao", "5MB"],
            ["**.csv**",        "Planilhas exportadas do banco", "5MB"],
            ["**.pdf**",        "Faturas de cartao de credito", "10MB"],
        ]
    )

    add_section_heading(doc, "Fluxo OFX/QFX (3 etapas)", level=3)
    add_styled_table(doc,
        ["Etapa", "Descricao"],
        [
            ["1", "**Upload** — Selecione a conta de destino e o arquivo OFX/QFX."],
            ["2", "**Revisao** — Confira as transacoes extraidas, ajuste categorias e revise duplicatas."],
            ["3", "**Resumo** — Veja o resultado da importacao."],
        ],
        step_table=True
    )

    add_section_heading(doc, "Fluxo CSV (4 etapas)", level=3)
    add_styled_table(doc,
        ["Etapa", "Descricao"],
        [
            ["1", "**Upload** — Selecione a conta de destino e o arquivo CSV."],
            ["2", "**Mapeamento** — Indique qual coluna corresponde a data, valor e descricao. O sistema detecta automaticamente quando possivel."],
            ["3", "**Revisao** — Confira as transacoes, ajuste categorias e revise duplicatas."],
            ["4", "**Resumo** — Veja o resultado da importacao."],
        ],
        step_table=True
    )
    add_callout(
        doc,
        "**Dica:** Arquivos CSV de bancos como Santander possuem linhas de metadados antes do cabecalho. "
        "O sistema detecta e ignora essas linhas automaticamente.",
        "info"
    )

    add_section_heading(doc, "Fluxo PDF (3 etapas)", level=3)
    add_styled_table(doc,
        ["Etapa", "Descricao"],
        [
            ["1", "**Upload** — Selecione a conta de destino e o arquivo PDF."],
            ["2", "**Revisao** — A inteligencia artificial (Gemini) extrai as transacoes do PDF automaticamente. Confira os dados, ajuste categorias e revise duplicatas."],
            ["3", "**Resumo** — Veja o resultado da importacao."],
        ],
        step_table=True
    )
    add_callout(
        doc,
        "**Importante:** PDFs protegidos por senha nao sao suportados. Se seu banco exporta o PDF com senha "
        "(ex: CPF), abra o arquivo, salve uma copia sem senha e importe a copia.",
        "warning"
    )

    add_section_heading(doc, "Etapa de Revisao (comum a todos os formatos)", level=3)
    add_body_paragraph(
        doc,
        "O sistema exibe todas as transacoes encontradas no arquivo. Para cada "
        "linha, voce pode atribuir ou alterar a categoria. Transacoes duplicadas "
        "(mesma conta, data e valor) sao sinalizadas automaticamente. Se voce tiver "
        "regras de categorizacao configuradas (em Configuracoes > Regras de Importacao), "
        "as categorias serao preenchidas automaticamente com um badge **Auto**. "
        "Revise os dados e clique em **Importar**."
    )

    add_section_heading(doc, "Resumo final", level=3)
    add_styled_table(doc,
        ["Informacao", "Significado"],
        [
            ["Importadas", "Transacoes adicionadas com sucesso"],
            ["Ignoradas",  "Transacoes que voce optou por nao importar"],
            ["Duplicatas", "Transacoes ja existentes que foram detectadas e ignoradas"],
        ]
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 6 — RECORRENTES
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "6  Transacoes Planejadas (Recorrentes)", level=1)

    add_body_paragraph(
        doc,
        "Transacoes planejadas representam movimentacoes que se repetem ou que "
        "estao programadas para o futuro. Elas alimentam automaticamente o "
        "**Fluxo Previsto** e o comparativo **Previsto vs Realizado** no Dashboard."
    )

    add_section_heading(doc, "6.1  Tipos de frequencia", level=2)
    add_styled_table(doc,
        ["Frequencia", "Quando usar", "Exemplo"],
        [
            ["**Recorrente (sem prazo)**",  "Repete todo mes indefinidamente",                      "Aluguel, salario, plano de saude"],
            ["**Pontual (mes unico)**",     "Ocorre em um unico mes especifico",                    "IPVA em janeiro, matricula escolar"],
            ["**Recorrente com periodo**",  "Repete mensalmente dentro de um intervalo definido",    "Parcelas de janeiro a junho"],
        ]
    )

    add_section_heading(doc, "6.2  Criar uma transacao planejada", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Clique em **Nova transacao**."],
            ["2", "Preencha o formulario (veja campos abaixo)."],
            ["3", "Clique em **Criar**."],
        ],
        step_table=True
    )

    add_section_heading(doc, "Campos do formulario", level=3)
    add_styled_table(doc,
        ["Campo", "Descricao"],
        [
            ["Tipo",                                "Receita ou Despesa"],
            ["Valor (R$)",                          "Valor esperado da movimentacao"],
            ["Conta",                               "Conta associada"],
            ["Categoria",                           "Filtrada pelo tipo escolhido"],
            ["Descricao",                           "Texto livre — ex: \"Aluguel\", \"Salario\", \"Parcela TV\""],
            ["Frequencia",                          "Recorrente (sem prazo), Pontual ou Recorrente com periodo"],
            ["Mes / Mes de inicio / Mes de termino","Campos condicionais, variam conforme a frequencia"],
            ["Dia do mes",                          "Dia em que a transacao ocorre (1 a 31)"],
            ["Ativo",                               "Se desmarcado, a transacao nao sera considerada nas projecoes"],
        ]
    )

    add_section_heading(doc, "6.3  Editar, desativar e excluir", level=2)
    add_styled_table(doc,
        ["Acao", "Como fazer"],
        [
            ["Editar",     "Clique no icone de **lapis**."],
            ["Desativar",  "Na edicao, desmarque o campo **Ativo**. A transacao permanece no historico, mas sai das projecoes."],
            ["Excluir",    "Clique no icone de **lixeira** (com confirmacao)."],
        ]
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 7 — FLUXO
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "7  Fluxo", level=1)

    add_body_paragraph(
        doc,
        "A pagina de Fluxo possui duas abas, acessiveis por um seletor no topo da pagina."
    )

    add_section_heading(doc, "7.1  Fluxo Diario", level=2)
    add_body_paragraph(
        doc,
        "Mostra o detalhamento **dia a dia** do mes selecionado. Cada linha "
        "representa uma movimentacao (real ou planejada)."
    )
    add_styled_table(doc,
        ["Coluna", "O que mostra"],
        [
            ["Dia",              "Data da movimentacao"],
            ["Descricao",        "Nome da transacao"],
            ["Categoria",        "Categoria com icone visual"],
            ["Valor",            "Valor da movimentacao (positivo ou negativo)"],
            ["Saldo Acumulado",  "Saldo progressivo — permite identificar em que dias o caixa fica apertado"],
        ]
    )
    add_body_paragraph(doc, "Use as setas **<** e **>** para navegar entre os meses.")

    add_section_heading(doc, "7.2  Fluxo Previsto", level=2)
    add_body_paragraph(
        doc,
        "Exibe uma **projecao de varios meses** — o mes atual mais tres meses futuros."
    )
    add_styled_table(doc,
        ["Coluna", "O que mostra"],
        [
            ["Categoria",  "Nome da categoria"],
            ["Previsto",   "Valor esperado com base em recorrentes ou media historica"],
            ["Realizado",  "Transacoes efetivas ja registradas"],
            ["Diferenca",  "Desvio entre o previsto e o realizado"],
        ]
    )
    add_body_paragraph(doc, "O saldo projetado e acumulado mes a mes, oferecendo uma visao de medio prazo.")
    add_callout(
        doc,
        "**Como funciona a projecao:** Categorias configuradas como \"Recorrente\" usam o valor fixo "
        "das transacoes planejadas. Categorias configuradas como \"Historico\" usam a media dos meses anteriores.",
        "info"
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 8 — INVESTIMENTOS
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "8  Investimentos", level=1)

    add_body_paragraph(doc, "A pagina de Investimentos possui duas abas: **Carteira** e **Evolucao**.")

    add_section_heading(doc, "8.1  Carteira", level=2)
    add_body_paragraph(
        doc,
        "Exibe todos os investimentos cadastrados, agrupados por tipo de produto "
        "(CDB, Tesouro, Acoes, etc.). Cada card mostra o nome, tipo, indexador, "
        "saldo atual, conta associada, taxa e vencimento."
    )

    add_section_heading(doc, "Criar um investimento", level=3)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Clique em **Novo investimento**."],
            ["2", "Preencha o formulario (veja campos abaixo)."],
            ["3", "Clique em **Criar investimento**."],
        ],
        step_table=True
    )
    add_callout(doc, "**Pre-requisito:** Voce precisa ter pelo menos uma conta cadastrada.", "info")

    add_section_heading(doc, "Campos do formulario", level=3)
    add_styled_table(doc,
        ["Campo", "Descricao"],
        [
            ["Nome",              "Nome descritivo — ex: \"CDB Banco Inter 120% CDI\""],
            ["Conta / Corretora", "Conta existente onde o investimento esta custodiado"],
            ["Produto",           "CDB, Tesouro, Acoes, Cripto, Fundo ou Outro"],
            ["Indexador",         "CDI, IPCA, Prefixado, entre outros"],
            ["Taxa contratada",   "Texto livre — ex: \"120% CDI\", \"IPCA+6,5%\""],
            ["Vencimento",        "Data de vencimento (opcional)"],
            ["Observacoes",       "Notas adicionais (opcional)"],
        ]
    )

    add_section_heading(doc, "8.2  Lancamentos", level=2)
    add_body_paragraph(
        doc,
        "Cada investimento possui seu proprio historico de lancamentos. "
        "Para acessa-lo, clique em **Lancamentos** no card do investimento."
    )

    add_section_heading(doc, "Tipos de lancamento", level=3)
    add_styled_table(doc,
        ["Tipo", "Significado"],
        [
            ["**Aporte**",  "Entrada de dinheiro no investimento"],
            ["**Resgate**", "Retirada de dinheiro do investimento"],
            ["**Saldo**",   "Atualizacao de posicao (ex: extrato mensal)"],
        ]
    )

    add_section_heading(doc, "Registrar um lancamento", level=3)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "No card do investimento, clique em **Lancamentos**."],
            ["2", "Clique em **Novo lancamento**."],
            ["3", "Selecione o **Tipo**, informe a **Data** e o **Valor (R$)**."],
            ["4", "Confirme o lancamento."],
        ],
        step_table=True
    )
    add_body_paragraph(doc, "O saldo do investimento e calculado automaticamente a partir dos lancamentos registrados.")

    add_section_heading(doc, "8.3  Evolucao", level=2)
    add_body_paragraph(
        doc,
        "A aba Evolucao mostra um quadro com a **posicao mensal** de cada "
        "investimento ao longo do tempo, permitindo acompanhar o crescimento "
        "da carteira mes a mes."
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 9 — ASSISTENTE IA
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "9  Assistente IA", level=1)

    add_body_paragraph(
        doc,
        "O Assistente Financeiro e um chat com inteligencia artificial que analisa "
        "seus **dados financeiros reais** — contas, transacoes, recorrentes, "
        "investimentos e projecoes — para oferecer diagnosticos e orientacoes personalizadas."
    )

    add_section_heading(doc, "9.1  Como usar", level=2)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Acesse **Assistente IA** na sidebar."],
            ["2", "Na primeira visita, clique em uma das 4 perguntas sugeridas ou digite sua propria pergunta."],
            ["3", "Pressione **Enter** para enviar (ou clique no botao de envio)."],
            ["4", "A resposta e exibida progressivamente enquanto e gerada."],
        ],
        step_table=True
    )
    add_styled_table(doc,
        ["Atalho", "Funcao"],
        [
            ["**Enter**",         "Envia a mensagem"],
            ["**Shift + Enter**", "Pula linha sem enviar"],
        ]
    )
    add_callout(doc, "**Limite:** 2.000 caracteres por mensagem.", "info")

    add_section_heading(doc, "9.2  Contexto conversacional", level=2)
    add_body_paragraph(
        doc,
        "O assistente **mantem o contexto da conversa**. Cada nova pergunta "
        "considera as mensagens anteriores. Voce pode pedir um diagnostico e, "
        "na sequencia, perguntar *\"como melhorar isso?\"* sem precisar repetir o contexto."
    )

    add_section_heading(doc, "9.3  Copiar respostas", level=2)
    add_body_paragraph(
        doc,
        "Passe o mouse sobre qualquer resposta do assistente para revelar o "
        "**botao de copiar** no canto superior direito. Ao clicar, o texto e "
        "copiado e o icone muda para um check verde por 2 segundos, confirmando a copia."
    )

    add_section_heading(doc, "9.4  Exemplos de perguntas", level=2)
    add_styled_table(doc,
        ["Pergunta", "Tipo de analise"],
        [
            ["\"Como esta minha saude financeira?\"",          "Diagnostico geral"],
            ["\"Minhas despesas estao controladas?\"",         "Analise de gastos"],
            ["\"Minha carteira esta diversificada?\"",         "Analise de investimentos"],
            ["\"Tenho reserva de emergencia?\"",               "Planejamento de reserva"],
            ["\"Quais categorias estao acima do previsto?\"",  "Orcamento"],
            ["\"Como posso economizar mais?\"",                "Recomendacoes"],
        ]
    )
    add_callout(doc, "**Nota:** O assistente e baseado nos seus dados reais, mas nao substitui aconselhamento financeiro profissional.", "warning")

    # ═══════════════════════════════════════════════════════════
    # SECTION 10 — CONFIGURACOES
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "10  Configuracoes", level=1)

    add_body_paragraph(doc, "A pagina de Configuracoes possui tres abas: **Geral**, **Categorias** e **Regras de Importacao**.")

    add_section_heading(doc, "10.1  Geral", level=2)
    add_body_paragraph(doc, "A aba Geral contem duas configuracoes: **Dia de fechamento** e **Meta de reserva de emergencia**.")

    add_section_heading(doc, "Dia de fechamento", level=3)
    add_body_paragraph(doc, "O dia de fechamento define quando comeca e termina seu \"mes financeiro\".")
    add_styled_table(doc,
        ["Configuracao", "Exemplo"],
        [
            ["Dia 1 (padrao)", "Fevereiro = 01/fev a 28/fev"],
            ["Dia 10",         "Fevereiro = 10/fev a 09/mar"],
            ["Dia 25",         "Fevereiro = 25/fev a 24/mar"],
        ]
    )
    add_body_paragraph(
        doc,
        "Essa configuracao e util para quem recebe salario em um dia diferente do "
        "dia 1. Ela afeta o Dashboard, o Fluxo e todas as projecoes."
    )

    add_section_heading(doc, "Como alterar", level=3)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Selecione o dia desejado no dropdown (1 a 28)."],
            ["2", "Clique em **Salvar**."],
        ],
        step_table=True
    )

    add_section_heading(doc, "Meta de reserva de emergencia", level=3)
    add_body_paragraph(
        doc,
        "Defina quantos meses de despesas voce deseja manter como reserva de emergencia. "
        "Essa meta e usada no calculo do KPI de Reserva no Dashboard e nos insights proativos."
    )
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Selecione a meta desejada no dropdown: **3**, **6**, **9** ou **12 meses**."],
            ["2", "Clique em **Salvar**."],
        ],
        step_table=True
    )
    add_body_paragraph(
        doc,
        "O KPI de Reserva no Dashboard exibira uma barra de progresso mostrando o "
        "percentual atingido em relacao a meta configurada (ex: \"4.2 / 6 meses (70%)\")."
    )

    add_section_heading(doc, "10.2  Categorias", level=2)
    add_body_paragraph(doc, "Gerencie as categorias usadas para classificar suas transacoes.")

    add_section_heading(doc, "Criar uma categoria", level=3)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Clique em **Nova categoria**."],
            ["2", "Preencha o formulario (veja campos abaixo)."],
            ["3", "Clique em **Criar categoria**."],
        ],
        step_table=True
    )

    add_section_heading(doc, "Campos do formulario", level=3)
    add_styled_table(doc,
        ["Campo", "Descricao"],
        [
            ["Nome",              "Nome da categoria — ex: \"Alimentacao\", \"Salario\", \"Lazer\""],
            ["Tipo",              "Receita ou Despesa"],
            ["Tipo de projecao",  "**Historico** (media dos meses anteriores) ou **Recorrente** (valor fixo das transacoes planejadas)"],
            ["Teto mensal (R$)",  "Limite de gastos para categorias de despesa (opcional). Quando definido, o Dashboard usara esse valor como referencia e emitira alertas ao se aproximar ou ultrapassar o teto."],
        ]
    )
    add_body_paragraph(
        doc,
        "Cada categoria exibe automaticamente um icone visual baseado no nome "
        "(ex: alimentacao exibe um icone de comida, transporte exibe um carro)."
    )
    add_callout(doc, "**Atencao:** Categorias com transacoes vinculadas nao podem ser excluidas. Reclassifique as transacoes antes de remover a categoria.", "warning")

    add_section_heading(doc, "10.3  Regras de Importacao", level=2)
    add_body_paragraph(
        doc,
        "Regras de categorizacao automatica que sao aplicadas durante a importacao "
        "de extratos (OFX, CSV e PDF). Cada regra associa um **padrao de texto** a uma **categoria**."
    )

    add_section_heading(doc, "Criar uma regra", level=3)
    add_styled_table(doc,
        ["Passo", "Acao"],
        [
            ["1", "Na aba **Regras de Importacao**, preencha o padrao (ex: \"SUPERMERCADO\", \"UBER\", \"PIX\")."],
            ["2", "Selecione a categoria que sera atribuida automaticamente."],
            ["3", "Clique em **Adicionar**."],
        ],
        step_table=True
    )
    add_body_paragraph(
        doc,
        "Quando uma transacao importada contem o padrao no campo de descricao, a categoria "
        "e atribuida automaticamente e sinalizada com um badge **Auto** na tela de revisao."
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 11 — GUIA DE CONFIGURACAO INICIAL
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "11  Guia de Configuracao Inicial", level=1)

    add_body_paragraph(
        doc,
        "Para aproveitar todos os recursos do FinApp, siga esta sequencia ao "
        "configurar a plataforma pela primeira vez:"
    )
    add_styled_table(doc,
        ["Ordem", "Acao", "Por que"],
        [
            ["1", "Cadastre suas **contas**",              "Sao a base para todas as movimentacoes"],
            ["2", "Revise as **categorias**",              "As categorias padrao sao um bom comeco — ajuste conforme sua realidade"],
            ["3", "Configure o **dia de fechamento**",     "Se seu ciclo financeiro nao comeca no dia 1, ajuste em Configuracoes"],
            ["4", "Cadastre as **recorrentes**",           "Registre receitas e despesas fixas. Isso alimenta as projecoes"],
            ["5", "Registre suas **transacoes**",          "A cada gasto ou recebimento, registre. Use a importacao (OFX, CSV ou PDF) para agilizar"],
            ["6", "Cadastre seus **investimentos**",       "Registre os investimentos e atualize os saldos mensalmente"],
        ],
        step_table=True
    )

    # ═══════════════════════════════════════════════════════════
    # SECTION 12 — USO NO DIA A DIA
    # ═══════════════════════════════════════════════════════════
    add_section_heading(doc, "12  Uso no Dia a Dia", level=1)

    add_styled_table(doc,
        ["Rotina", "Frequencia sugerida", "O que fazer"],
        [
            ["Consultar o Dashboard",     "Diariamente",           "Visao rapida de receitas, despesas e saldo do mes"],
            ["Registrar transacoes",      "A cada movimentacao",   "Manter os dados sempre atualizados"],
            ["Importar extrato",           "Semanalmente",          "Importar transacoes do banco (OFX, CSV ou PDF) sem digitacao manual"],
            ["Consultar o Fluxo Diario",  "Quando necessario",     "Ver o saldo projetado para dias especificos"],
            ["Consultar o Fluxo Previsto","Mensalmente",           "Planejar os proximos 3 meses"],
            ["Atualizar investimentos",   "Mensalmente",           "Registrar aportes, resgates ou atualizar saldo"],
            ["Revisar fechamento mensal", "Mensalmente",           "Usar o botao \"Revisar mes\" no Dashboard para avaliar desvios e ajustar planejamento"],
            ["Verificar recorrencias sugeridas", "Mensalmente",    "Conferir se o sistema detectou padroes que devem virar transacoes recorrentes"],
            ["Perguntar ao Assistente IA","Quando quiser",         "Obter diagnosticos e orientacoes personalizadas"],
        ]
    )

    # ── Footer ─────────────────────────────────────────────────
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(40)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = p.add_run("FinApp")
    run.font.name = FONT_TITLE
    run.font.size = Pt(12)
    run.font.color.rgb = EMERALD_600
    run.bold = True

    run = p.add_run("  —  Gestao Financeira Pessoal")
    run.font.name = FONT_BODY
    run.font.size = Pt(10)
    run.font.color.rgb = SLATE_500

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("Versao 2.0  |  Fevereiro 2026")
    run.font.name = FONT_BODY
    run.font.size = Pt(9)
    run.font.color.rgb = SLATE_500
    run.italic = True

    # ── Save ───────────────────────────────────────────────────
    output_path = os.path.join(os.path.dirname(__file__), "FinApp - Manual do Usuario.docx")
    doc.save(output_path)
    print(f"Manual gerado: {output_path}")


if __name__ == "__main__":
    build_document()
