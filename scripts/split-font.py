#!/usr/bin/env python3
"""
Python Chinese Font Slicing (分包切片) Tool using fonttools & brotli.
Generates small woff2 slices with unicode-range CSS declarations.
"""

import os
import sys
import math
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

# 常用汉字频率表（现代汉语常用字 3500 字）
# 一级常用字 (2500)
COMMON_1 = (
    "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经"
    "十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事"
    "平形相全表间样与关各想及问十者最立代想数建党情路向老原件指神记果期提公为结导月系心明强力保已便见只现文管手由命利入使并别"
    "总反展见领由门受重相结特解白真设战百目或由先常解系题走接应变运听受造条活西名正改完研认长现身意统各算直向调规至路即感通"
    "保真研信设组情反步各规指建总受领特算战百题先身意统各直感应变至调路即造听接改西完认名直运各活正长现走条研名通身"
)

def format_unicode_range(unicodes):
    if not unicodes:
        return ""
    unicodes = sorted(set(unicodes))
    ranges = []
    start = unicodes[0]
    end = unicodes[0]
    
    for u in unicodes[1:]:
        if u == end + 1:
            end = u
        else:
            if start == end:
                ranges.append(f"U+{start:04X}")
            else:
                ranges.append(f"U+{start:04X}-{end:04X}")
            start = u
            end = u
    if start == end:
        ranges.append(f"U+{start:04X}")
    else:
        ranges.append(f"U+{start:04X}-{end:04X}")
    return ", ".join(ranges)

def split_font(input_path: str, output_dir: str, font_family: str = "canger", chunk_size: int = 180):
    input_file = Path(input_path)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    print(f"📖 正在加载字体: {input_file}...")
    font = TTFont(input_file)
    cmap = font.getBestCmap()
    all_unicodes = set(cmap.keys())
    print(f"✨ 字体包含字符总数: {len(all_unicodes)}")

    # 1. 提取基础字符集 (ASCII + 常用英文符号 + 常用标点符号)
    base_unicodes = set()
    for u in all_unicodes:
        # ASCII + Latin-1 Supplement + General Punctuation + CJK Symbols & Punctuation + Fullwidth forms
        if (0x0020 <= u <= 0x007E) or (0x00A0 <= u <= 0x00FF) or (0x2000 <= u <= 0x206F) or (0x3000 <= u <= 0x303F) or (0xFF00 <= u <= 0xFFEF):
            base_unicodes.add(u)

    remaining_unicodes = all_unicodes - base_unicodes

    # 2. 提取常用汉字中的字符
    common_chars = set(ord(c) for c in COMMON_1 if ord(c) in remaining_unicodes)
    remaining_unicodes -= common_chars

    # 3. 按汉字频率与 Unicode 顺序组织切片
    slices = []
    
    # Slice 0: 基础标点与英文符号
    if base_unicodes:
        slices.append(("base", sorted(base_unicodes)))

    # 常用字切片 (每 chunk_size 个字为一个切片)
    common_list = sorted(common_chars)
    for i in range(0, len(common_list), chunk_size):
        chunk = common_list[i : i + chunk_size]
        slices.append((f"common_{i // chunk_size:02d}", chunk))

    # 剩余字符切片 (每 2 * chunk_size 个字为一个切片)
    rem_list = sorted(remaining_unicodes)
    large_chunk_size = chunk_size * 2
    for i in range(0, len(rem_list), large_chunk_size):
        chunk = rem_list[i : i + large_chunk_size]
        slices.append((f"cjk_{i // large_chunk_size:03d}", chunk))

    print(f"🧩 共规划 {len(slices)} 个切片分包，正在执行 WOFF2 切割打包...")

    css_rules = []
    total_size = 0

    for idx, (name, unicodes) in enumerate(slices):
        slice_filename = f"canger_{idx:03d}_{name}.woff2"
        slice_output = out_path / slice_filename

        # 配置 Subsetter
        options = subset.Options()
        options.flavor = "woff2"
        options.desubroutinize = True
        options.hinting = False  # 移动端/高分屏去 hinting 大幅减小体积
        options.drop_tables += ["JSTF", "DSIG", "EBDT", "EBLC", "EBSC", "PCLT", "LTSH"]

        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=unicodes)
        
        # 加载独立实例执行切割
        sub_font = TTFont(input_file)
        subsetter.subset(sub_font)
        sub_font.flavor = "woff2"
        sub_font.save(slice_output)
        sub_font.close()

        file_size = slice_output.stat().st_size
        total_size += file_size

        urange = format_unicode_range(unicodes)
        css_rules.append(
            f"/* [{idx:03d}] {name} ({len(unicodes)} chars, {file_size / 1024:.1f} KB) */\n"
            f"@font-face {{\n"
            f"  font-family: '{font_family}';\n"
            f"  font-style: normal;\n"
            f"  font-weight: 400;\n"
            f"  font-display: swap;\n"
            f"  src: url('/fonts/canger/{slice_filename}') format('woff2');\n"
            f"  unicode-range: {urange};\n"
            f"}}\n"
        )

        if idx % 10 == 0 or idx == len(slices) - 1:
            print(f"   [{idx + 1}/{len(slices)}] 已完成: {slice_filename} ({file_size / 1024:.1f} KB)")

    font.close()

    # 写入 CSS
    css_file = out_path / "canger.css"
    with open(css_file, "w", encoding="utf-8") as f:
        f.write("".join(css_rules))

    print(f"\n🎉 切片切割全部完成！")
    print(f"📦 切片总数: {len(slices)} 个")
    print(f"📊 切片后总大小: {total_size / 1024 / 1024:.2f} MB (原文件: {input_file.stat().st_size / 1024 / 1024:.2f} MB)")
    print(f"📄 CSS 规则文件: {css_file}")

if __name__ == "__main__":
    split_font(
        input_path="docs/public/res/fonts/canger.ttf",
        output_dir="docs/public/fonts/canger",
        font_family="canger",
        chunk_size=180
    )
