from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.text import MSO_AUTO_SIZE

# 创建演示文稿
prs = Presentation()
prs.slide_width = Inches(13.333)  # 16:9 宽屏
prs.slide_height = Inches(7.5)

# 定义颜色方案
PRIMARY = RGBColor(0x1F, 0x3A, 0x5F)  # 深蓝色
SECONDARY = RGBColor(0xC8, 0xD3, 0xE6)  # 浅蓝色
ACCENT = RGBColor(0x0D, 0x94, 0x88)  # 青色
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BLACK = RGBColor(0x1F, 0x1F, 0x1F)
GRAY = RGBColor(0x7A, 0x7A, 0x7A)
LIGHT_BG = RGBColor(0xF7, 0xF5, 0xF0)  # 米白色背景
DANGER = RGBColor(0xB8, 0x50, 0x42)  # 红棕色（问题/痛点）
GREEN = RGBColor(0x2C, 0x5F, 0x2D)  # 深绿色（正向/结业）

def add_background(slide, color):
    """为幻灯片添加背景色"""
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    bg.line.fill.background()  # 无边框
    # 将背景移到最底层
    spTree = bg._element.getparent()
    spTree.remove(bg._element)
    spTree.insert(2, bg._element)

def add_text_box(slide, left, top, width, height, text, font_size=18, bold=False, color=BLACK, alignment=PP_ALIGN.LEFT):
    """添加文本框"""
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = alignment
    run = p.runs[0]
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    return tb

def add_bullet_list(slide, left, top, width, height, items, font_size=16, color=BLACK):
    """添加项目符号列表"""
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True

    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"• {item}"
        p.level = 0
        run = p.runs[0]
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
    return tb

def add_section_header(slide, title):
    """添加章节标题"""
    add_text_box(slide, 0.5, 0.5, 12.3, 1.0, title, font_size=32, bold=True, color=PRIMARY)
    # 添加装饰线
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(1.3), Inches(2), Inches(0.05)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()

# 1. 封面幻灯片
slide = prs.slides.add_slide(prs.slide_layouts[6])  # 空白布局
add_background(slide, PRIMARY)
add_text_box(slide, 1, 1.9, 11.3, 2, "英语学习小程序", font_size=48, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
add_text_box(slide, 1, 3.6, 11.3, 1, "EnglishMaster · 从零基础到自由沟通", font_size=24, color=SECONDARY, alignment=PP_ALIGN.CENTER)
add_text_box(slide, 1, 4.9, 11.3, 1, "学习设计升级方案", font_size=20, bold=True, color=ACCENT, alignment=PP_ALIGN.CENTER)
add_text_box(slide, 1, 5.8, 11.3, 0.6, "从「功能货架」到「一条清晰主线」  ·  面向零基础成人自学", font_size=15, color=GRAY, alignment=PP_ALIGN.CENTER)

# 2. 为什么要升级（问题诊断）
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "为什么要升级学习设计")

add_text_box(slide, 0.5, 1.7, 12.3, 0.9, "评估结论：技术实现与 UI 不差（语音评测真实调后端），但「学习设计」是最弱短板——目前更像功能堆砌，还不是一条能带零基础用户走完的学习路径。", font_size=17, bold=True, color=PRIMARY)

def add_pain_card(slide, x, y, tag, title, items):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(3.8), Inches(3.9))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = DANGER
    card.line.width = Pt(1.5)
    tag_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.2), Inches(y + 0.25), Inches(1.0), Inches(0.5))
    tag_box.fill.solid()
    tag_box.fill.fore_color.rgb = DANGER
    tag_box.line.fill.background()
    add_text_box(slide, x + 0.2, y + 0.32, 1.0, 0.4, tag, font_size=14, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, x + 0.2, y + 0.95, 3.4, 0.8, title, font_size=17, bold=True, color=PRIMARY)
    add_bullet_list(slide, x + 0.2, y + 1.75, 3.4, 2, items, font_size=13.5, color=BLACK)

add_pain_card(slide, 0.5, 2.9, "P0-1", "复习机制形同虚设", [
    "间隔写死：认识+7天 / 不认识+1天",
    "前端没有任何「复习」入口",
    "只背新词、旧词再不出现 → 学越多忘越多"
])
add_pain_card(slide, 4.7, 2.9, "P0-2", "音标每日任务过载", [
    "要求每天把 48 个音标全部读到 80 分",
    "音标本是「一次性入门课」，不该天天刷",
    "门槛过高，第一天就劝退"
])
add_pain_card(slide, 8.9, 2.9, "P0-3", "无主线 · 选择过载", [
    "首页 3 块并列入口 + 学习中心 3 门课平铺",
    "语法/单词各等级可随意点，无前置依赖",
    "零基础不知道「先点哪个」"
])

# 3. 升级核心
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "升级核心：一条主线 + 两大机制")

add_text_box(slide, 0.5, 1.7, 12.3, 0.7, "学习产品对新手最重要的是一条清晰主线，而不是功能货架。", font_size=18, bold=True, color=PRIMARY)

main_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(2.5), Inches(12.3), Inches(1.4))
main_box.fill.solid()
main_box.fill.fore_color.rgb = PRIMARY
main_box.line.fill.background()
add_text_box(slide, 0.7, 2.65, 11.9, 0.5, "唯一主线载体：成长地图（adventure）", font_size=19, bold=True, color=WHITE)
add_text_box(slide, 0.7, 3.2, 11.9, 0.6, "音标 → 基础单词 → 基础句型语法 → 场景对话  ·  中高级内容按进度解锁  ·  首页给「继续学习」单一主 CTA", font_size=15, color=SECONDARY)

def add_mech_card(slide, x, y, title, items, color):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(5.9), Inches(2.9))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = color
    card.line.width = Pt(2)
    add_text_box(slide, x + 0.25, y + 0.2, 5.4, 0.6, title, font_size=18, bold=True, color=color)
    add_bullet_list(slide, x + 0.25, y + 0.95, 5.4, 1.8, items, font_size=14.5, color=BLACK)

add_mech_card(slide, 0.5, 4.2, "机制一 · 入学自测 / 测试跳过 (test-out)", [
    "不假设所有人从零开始",
    "进入某阶段前给 5–8 题小自测",
    "测过即跳过该阶段，没测过从头学",
    "会的人不被浪费，不会的人有台阶"
], ACCENT)
add_mech_card(slide, 6.9, 4.2, "机制二 · 音标分组通关（一次性课程）", [
    "48 音标分组逐组解锁：元音 → 辅音 → 组合音",
    "每天 5–6 个，达标 80 分算掌握",
    "一组全掌握才解锁下一组",
    "48 个全通关后结课，永不再占每日任务"
], GREEN)

# 4. 五阶段主线总览
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "五阶段主线总览")

add_text_box(slide, 0.5, 1.7, 12.3, 0.7, "用成长地图当载体，做成地图上的 5 个大关；后一阶段默认锁定，达成前一阶段目标才解锁（允许测试跳过）。", font_size=16, bold=True, color=PRIMARY)

def add_stage_pill(slide, x, y, w, num, title, desc, color):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(3.0))
    box.fill.solid()
    box.fill.fore_color.rgb = color
    box.line.fill.background()
    add_text_box(slide, x + 0.12, y + 0.22, w - 0.24, 0.6, f"阶段 {num}", font_size=15, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, x + 0.08, y + 0.85, w - 0.16, 0.9, title, font_size=15, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, x + 0.08, y + 1.75, w - 0.16, 1.1, desc, font_size=12, color=WHITE, alignment=PP_ALIGN.CENTER)

stages = [
    ("0", "入学定位\n(可选)", "音标自测+常见词\n判断起点/能否跳过", GRAY),
    ("1", "语音入门", "音标分组通关\n约8–10天", PRIMARY),
    ("2", "基础词汇+句型", "Level0词汇+be动词\n一般现在时", ACCENT),
    ("3", "日常表达", "Level1词汇+核心语法\n入门场景对话", DANGER),
    ("4", "自由沟通", "Level2词汇+进阶语法\nAI自由对话", GREEN),
]
sx = 0.5
sw = 2.3
gap = 0.2
for i, (num, title, desc, color) in enumerate(stages):
    x = sx + i * (sw + gap)
    add_stage_pill(slide, x, 2.7, sw, num, title, desc, color)
    if i < len(stages) - 1:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + sw + 0.02), Inches(4.1), Inches(gap - 0.04), Inches(0.12))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = GRAY
        arrow.line.fill.background()

add_text_box(slide, 0.5, 6.0, 12.3, 1.2, "主线锁定 + 单点可回看：主线推进按阶段走（避免迷路），但已推进到后段仍可随时回看任一音标或某组单词复习。每阶段有明确的「学会了什么」结业标志，给足正反馈。", font_size=15, color=BLACK)

# 5. 各阶段目标细化（阶段 0 / 1 / 2）
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "各阶段目标细化（阶段 0 – 2）")

def add_stage_detail(slide, x, y, w, h, header, color, goal, content, pass_std):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = color
    card.line.width = Pt(1.5)
    bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.55))
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    add_text_box(slide, x + 0.2, y + 0.08, w - 0.4, 0.45, header, font_size=15, bold=True, color=WHITE)
    add_bullet_list(slide, x + 0.2, y + 0.7, w - 0.4, h - 0.9, [
        f"目标：{goal}",
        f"内容：{content}",
        f"结业：{pass_std}",
    ], font_size=13, color=BLACK)

add_stage_detail(slide, 0.5, 1.8, 12.3, 1.55, "阶段 0 · 入学定位（可选，约 3 分钟）", GRAY,
    "系统判断你该从哪开始",
    "5–8 题小自测（听音选音标 + 几个 Level 0 常见词）",
    "完成即可；音标题正确率 ≥ 80% → 允许跳过阶段 1")
add_stage_detail(slide, 0.5, 3.5, 12.3, 1.55, "阶段 1 · 语音入门（音标通关，约 8–10 天）", PRIMARY,
    "看到音标能读、听到发音能辨认",
    "48 个音标分 3 组（元音→辅音→组合音），每天 5–6 个",
    "每个音标跟读 ≥ 80 分算掌握；整组通关解锁下一组；48 个全通关后结课，不再进每日任务")
add_stage_detail(slide, 0.5, 5.2, 12.3, 1.55, "阶段 2 · 基础词汇 + 基础句型", ACCENT,
    "认识最常用入门词，能说/看懂最简单一句话（如 I am a student.）",
    "Level 0 词汇 + 语法阶段 1（be 动词、一般现在时、主谓宾/主系表）",
    "Level 0 词汇 100% 掌握；基础句型语法点全部已掌握。允许自测整段跳过")

# 6. 各阶段目标细化（阶段 3 / 4）+ 达标规则
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "各阶段目标细化（阶段 3 – 4）")

add_stage_detail(slide, 0.5, 1.8, 12.3, 1.6, "阶段 3 · 日常表达", DANGER,
    "应付简单日常场景（点餐/问路），说出完整句子并被听懂",
    "Level 1 词汇 + 语法阶段 2（常用时态、情态动词）+ 入门场景对话（餐厅、问路）",
    "Level 1 词汇 100% 掌握；阶段 2 语法全掌握；≥ 1–2 个场景对话且 ≥ 80 分。允许自测整段跳过")
add_stage_detail(slide, 0.5, 3.6, 12.3, 1.6, "阶段 4 · 自由沟通", GREEN,
    "围绕熟悉话题与 AI 做多轮简单交流",
    "Level 2 高频口语词 + 语法阶段 3（从句、非谓语）+ AI 自由对话",
    "Level 2 词汇 100% 掌握；进阶语法全掌握；完成 N 轮 AI 自由对话且平均分达标")

rule_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(5.5), Inches(12.3), Inches(1.4))
rule_box.fill.solid()
rule_box.fill.fore_color.rgb = PRIMARY
rule_box.line.fill.background()
add_text_box(slide, 0.7, 5.62, 11.9, 0.5, "通用达标规则", font_size=16, bold=True, color=WHITE)
add_bullet_list(slide, 0.7, 6.05, 11.9, 0.8, [
    "词汇达标线 = 该阶段「精选分级词表」100% 掌握（切勿用整个词库，否则难结业）",
    "音标/发音达标线沿用全局 80 分；除音标外，有基础者均可通过自测整段跳过",
], font_size=13, color=SECONDARY)

# 7. P0 改进：真实 SRS + 今日复习入口
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "P0 改进：让复习真正跑起来")

add_text_box(slide, 0.5, 1.7, 6, 0.6, "问题", font_size=20, bold=True, color=DANGER)
add_bullet_list(slide, 0.5, 2.3, 6, 2.4, [
    "间隔写死：认识 +7 天 / 不认识 +1 天",
    "word_status 建了 interval/ease 字段，但插入恒为 1",
    "前端只统计「今日新学」，从不筛「今日该复习」",
    "结果：SRS 白做，学越多忘越多，挫败感极强",
], font_size=15, color=BLACK)

add_text_box(slide, 7, 1.7, 6, 0.6, "改法", font_size=20, bold=True, color=ACCENT)
add_bullet_list(slide, 7, 2.3, 6, 2.4, [
    "后端补到期复习接口：next_review_date ≤ 今天 的词",
    "固定 7/1 天 → 递增间隔：1 → 2 → 4 → 7 → 15 天",
    "答对 repetition 递增驱动，答错重置到第一档",
    "首页新增「今日复习 N 个」，排在「新学单词」之前",
], font_size=15, color=BLACK)

# 递增间隔可视化
add_text_box(slide, 0.5, 4.9, 12.3, 0.5, "递增间隔曲线（最小可用版）", font_size=16, bold=True, color=PRIMARY)
intervals = ["1 天", "2 天", "4 天", "7 天", "15 天"]
ix = 1.0
iw = 1.8
igap = 0.8
for i, label in enumerate(intervals):
    x = ix + i * (iw + igap)
    node = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(5.6), Inches(iw), Inches(0.8))
    node.fill.solid()
    node.fill.fore_color.rgb = ACCENT
    node.line.fill.background()
    add_text_box(slide, x, 5.75, iw, 0.5, label, font_size=16, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    if i < len(intervals) - 1:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + iw + 0.15), Inches(5.95), Inches(igap - 0.3), Inches(0.1))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = GRAY
        arrow.line.fill.background()

# 8. 首页重构：从并列货架到主线 + 今日任务
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "首页重构：主线 + 今日任务")

def add_ba_card(slide, x, title, title_color, items, border_color):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(2.0), Inches(5.9), Inches(4.6))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = border_color
    card.line.width = Pt(2)
    add_text_box(slide, x + 0.3, 2.2, 5.3, 0.6, title, font_size=20, bold=True, color=title_color)
    add_bullet_list(slide, x + 0.3, 2.95, 5.3, 3.5, items, font_size=15, color=BLACK)

add_ba_card(slide, 0.5, "现状（并列货架）", DANGER, [
    "今日任务 / 闯关游戏 / 专项挑战 三块并列",
    "音标每日任务：0/48，80 分达标",
    "学习中心：音标/单词/语法三课平铺无锁定",
    "闯关不回写掌握状态，用户疑惑「有啥用」",
    "五套进度系统割裂、有冗余感",
], DANGER)

add_ba_card(slide, 6.9, "升级后（主线 + 今日任务）", GREEN, [
    "顶部单一主 CTA：继续学习 → 下一步该做什么",
    "今日任务：今日复习 N 个（首位）→ 新学单词",
    "音标改为「总体通关进度 x/48」而非每日 48",
    "成长地图作为唯一主线载体，其余为其环节",
    "闯关回写主进度 或 定位为主线关卡内检验环节",
], GREEN)

# 9. 落地顺序
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "建议的落地顺序")

def add_step_row(slide, y, num, title, desc, color):
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.7), Inches(y), Inches(0.9), Inches(0.9))
    circle.fill.solid()
    circle.fill.fore_color.rgb = color
    circle.line.fill.background()
    add_text_box(slide, 0.7, y + 0.18, 0.9, 0.5, str(num), font_size=24, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, 1.9, y + 0.02, 11, 0.5, title, font_size=19, bold=True, color=PRIMARY)
    add_text_box(slide, 1.9, y + 0.5, 11, 0.5, desc, font_size=14, color=BLACK)

add_step_row(slide, 1.9, 1, "复习入口 + 音标任务量（小步快跑）", "改动集中在 home/index.vue + word.js；风险小见效快，直击「背了就忘」「第一天被劝退」", PRIMARY)
add_step_row(slide, 3.1, 2, "主线引导", "首页与成长地图关系重排，落地五阶段主线 + test-out；改动中等", ACCENT)
add_step_row(slide, 4.3, 3, "体验与激励", "闯关回写主进度 / 明确定位；答错补「为什么错」，错题本按知识点聚合弱点提示", DANGER)
add_step_row(slide, 5.5, 4, "水平诊断", "首次进入 5–8 题小测，自动推荐起点等级与主线位置；改造较大，放最后", GREEN)

# 10. 保留的技术能力 + 架构
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, LIGHT_BG)
add_section_header(slide, "保留的技术能力与架构")

add_text_box(slide, 0.5, 1.7, 12.3, 0.6, "本次是「学习设计」升级，技术底座与真实能力保留复用。", font_size=17, bold=True, color=PRIMARY)

def add_arch_box(slide, x, y, title, color, width=3.3, height=0.8):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(width), Inches(height))
    box.fill.solid()
    box.fill.fore_color.rgb = color
    box.line.fill.background()
    add_text_box(slide, x + 0.1, y + 0.2, width - 0.2, 0.6, title, font_size=14, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

add_arch_box(slide, 1.2, 2.7, "用户界面（微信小程序 / UniApp）", PRIMARY)
add_arch_box(slide, 1.2, 3.9, "业务逻辑层（Node.js 后端服务）", ACCENT)
add_arch_box(slide, 1.2, 5.1, "数据层（MySQL + word_status/SRS）", DANGER)
add_arch_box(slide, 1.2, 6.3, "外部服务（语音评测、AI 对话）", GREEN)
for y in [3.5, 4.7, 5.9]:
    arrow = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.75), Inches(y), Inches(0.1), Inches(0.4))
    arrow.fill.solid()
    arrow.fill.fore_color.rgb = GRAY
    arrow.line.fill.background()

add_text_box(slide, 6.5, 2.6, 6.3, 0.6, "已具备且保留的能力", font_size=18, bold=True, color=PRIMARY)
add_bullet_list(slide, 6.5, 3.2, 6.3, 3.5, [
    "语音评测真实：跟读录音调后端音素级评分",
    "四模式单词学习：听音辨义 / 看词想义 / 拼写 / 跟读",
    "语法课程体系：三阶段知识点 + 练习 + 错题本",
    "场景对话：餐厅点餐等情景任务",
    "成长地图 adventure：现成的主线载体",
    "统计 / 成就 / 打卡 / 提醒等激励模块",
], font_size=14, color=BLACK)

# 11. 总结与展望
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_background(slide, PRIMARY)
add_text_box(slide, 1, 1.6, 11.3, 1.5, "总结与展望", font_size=46, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)
add_text_box(slide, 1, 3.2, 11.3, 1, "让零基础用户走完一条清晰主线，而不是面对一堆功能", font_size=22, color=SECONDARY, alignment=PP_ALIGN.CENTER)
add_text_box(slide, 2, 4.4, 9.3, 2.4, "本次升级要点：\n• 一条主线：音标 → 词汇+句型 → 日常表达 → 自由沟通，成长地图为唯一载体\n• 两大机制：入学自测/测试跳过、音标分组通关\n• 真实 SRS：递增间隔 + 首页「今日复习」入口\n• 减负去冗余：首页只留「主线 + 今日任务」", font_size=17, color=WHITE, alignment=PP_ALIGN.LEFT)
add_text_box(slide, 1, 6.8, 11.3, 0.5, "先做最痛的两点（复习入口 + 音标任务量），小步快跑、逐步解锁。", font_size=15, color=GRAY, alignment=PP_ALIGN.CENTER)

# 保存演示文稿
import os
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "英语学习小程序方案.pptx")
prs.save(OUTPUT)
print(f"PPT已成功创建：{OUTPUT}")
