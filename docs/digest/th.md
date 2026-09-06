# Harness Engineering — สรุปย่อ (ภาษาไทย)

กลั่นจากคอร์ส *Learn Harness Engineering* (walkinglabs, MIT; สำเนาต้นฉบับ pin ไว้ที่
`sources/learn-harness-engineering/`) ฉบับนี้สำหรับคนอ่าน ส่วนที่ agent อ่านคือ `en.md`
ทุกหัวข้ออ้างไฟล์ต้นฉบับ สิ่งที่เราเพิ่มเองมีป้าย **[harness]**

## 1. Harness คืออะไร

Harness คือทุกอย่าง *รอบ* โมเดลที่ตัดสินว่างานจะเสร็จจริงไหม: system prompt, ไฟล์คำสั่ง, tools,
environment, ไฟล์สถานะ, คำสั่งตรวจสอบ, hooks, ตัวประเมิน ลูปหลัก (เรียกโมเดล → รัน tool → ดูผล →
เรียกอีก) เป็นแค่โครงกระดูก ระบบ *รอบ* ลูปต่างหากที่กำหนดความน่าเชื่อถือ เปลี่ยนชิ้นส่วนใดของ harness
ก็เท่ากับเปลี่ยน agent
*ที่มา: lecture 1–2; `harness-designs/claude-code/index.md`*

**ห้าระบบย่อย** ตามคอร์ส: Instructions · Tools · Environment · State · Feedback
skill `harness-creator` ที่แถมมาใช้อีกชุดที่เหมาะกับ repo: Instructions · State · Verification ·
Scope · Lifecycle **[harness]** `/harness:audit` ให้คะแนนตามชุดหลัง

## 2. ทำไม agent เก่ง ๆ ยังล้มเหลว (แผนที่ failure mode)

| Failure mode | อาการ | วิธีแก้หลัก | Artifact |
| --- | --- | --- | --- |
| เริ่ม session แล้วงง | เสียเวลาค้นหา setup และสถานะใหม่ทุกครั้ง | repo เป็น system of record | progress log |
| ขอบเขตบาน | เริ่มหลาย feature ไม่จบสักอัน | จำกัด scope ที่ active | feature list (`in_progress` ตัวเดียว) |
| ประกาศเสร็จก่อนเวลา | บอก "เสร็จ" หลังแก้โค้ด ก่อนมีหลักฐานที่รันได้ | ผูก "เสร็จ" กับ evidence | clean-state checklist, Stop gate |
| startup เปราะ | ทุก session เรียนวิธี boot ใหม่ | มาตรฐาน setup + verify | `init.sh` |
| handoff อ่อน | session ถัดไปไม่รู้อะไรผ่าน อะไรพัง ทำอะไรต่อ | handoff ชัดเจน | session handoff |
| review ตามใจ | คุณภาพขึ้นกับรสนิยมหรือความจำ | ให้คะแนนตามหมวดตายตัว | evaluator rubric |

หลักปฏิบัติ: เพิ่ม artifact ที่ *เล็กที่สุด* ที่แก้ failure ที่เห็นจริง อย่าแก้ความน่าเชื่อถือด้วยการ
ยัดข้อความเข้าไฟล์คำสั่งไฟล์เดียว
*ที่มา: `resources/reference/method-map.md`; lecture 5, 7, 9*

## 3. Repository คือ system of record

ทุก session เริ่มด้วย context window ว่าง อะไรที่อยู่แค่ในแชทจะหายไป ดังนั้น เขียนข้อสรุปลงไฟล์ใน
session เดียวกับที่ได้ข้อสรุป; เก็บ progress, feature state, decisions เป็นไฟล์ใน repo; ตั้งชื่อไฟล์ให้
สั้นและค้นเจอ; ความจริงหนึ่งเรื่องอยู่ที่เดียว (ลบสำเนาที่ล้าสมัย)
*ที่มา: lecture 3; `openai-advanced/sops/encode-knowledge-into-repo.md`*

บททดสอบของ repo ที่ initialize เรียบร้อย: session ใหม่ที่ไม่มีประวัติแชทตอบได้ว่า *repo นี้ทำอะไร,
start อย่างไร, verify อย่างไร, อะไรยังไม่เสร็จ, ขั้นต่อไปที่ดีที่สุดคืออะไร*
*ที่มา: `resources/reference/initializer-agent-playbook.md`*

## 4. ไฟล์คำสั่งยักษ์ไฟล์เดียวใช้ไม่ได้

ไฟล์แบบสารานุกรมตรวจ coverage/ความสด/เจ้าของไม่ได้ จึง drift แน่นอน คำตอบของ Codex: **AGENTS.md
เป็น "หน้าสารบัญ"** ราว 100 บรรทัดที่ชี้เข้า `docs/`; **บังคับ invariant ไม่จุกจิกวิธี implement**
คำตอบของ Claude Code: **แบ่ง scope เป็นชั้น** (org → user → project → local; ไฟล์ในโฟลเดอร์ย่อย
โหลดเมื่อต้องใช้) ให้คำสั่งโหลดใกล้จุดที่ใช้
*ที่มา: lecture 4; `harness-designs/codex/`; `harness-designs/claude-code/`*

**[harness]** `CLAUDE.md` ของโปรเจ็กตั้งเป้า ~60 บรรทัด: ตาราง routing, invariant เฉพาะโปรเจ็ก, คำสั่ง
Operating Loop ไม่อยู่ในนั้น (ADR-0004); invariant ที่ใช้ทุกโปรเจ็กอยู่ใน Profile

## 5. Operating Loop

เริ่ม: `pwd` → อ่าน progress log → อ่าน feature list → `git log --oneline -5` → รัน `init.sh` →
baseline smoke → ถ้าแดง แก้ก่อน → เลือก feature ค้างที่ priority สูงสุด → ทำแค่ตัวนั้นจน verify ได้
หรือ blocked อย่างชัดเจน
จบ (กระจกเงา): บันทึก progress → อัปเดต feature state → handoff ถ้าจำเป็น → commit งานที่ปลอดภัย →
ทิ้งทางกลับมาเริ่มใหม่ที่สะอาด
*ที่มา: `resources/reference/coding-agent-startup-flow.md`*

**[harness]** SessionStart hook ฉีดครึ่งแรกพร้อมสถานะจริง; `/harness:end` ทำครึ่งหลัง; Stop gate
บังคับ invariant ของ feature state

## 6. Feature list เป็น primitive ของ harness

รายการ feature ที่เครื่องอ่านได้: `status ∈ {not_started, in_progress, blocked, passing}`,
ขั้น `verification` ที่รันได้จริง, `evidence` ที่บันทึกไว้ กฎ: `in_progress` ตัวเดียว; `passing`
ต้องมี evidence; ห้ามเขียนรายการใหม่เพื่อซ่อนงานค้าง; ห้ามลดทอนการตรวจสอบเพื่อให้ดูเสร็จ
*ที่มา: lecture 8; `resources/templates/feature_list.json`; `pass-gate-policy.md`*

**[harness]** เพิ่ม `spec` (path ไป design ใต้ `.scratch/`) และ `depends_on` (ต้อง `passing` ก่อน
ตัวนี้จะ `in_progress` ได้) Stop gate ตรวจทั้งสอง

## 7. Agent ประกาศชัยชนะเร็วเกินไป

บทความ harness ของ Anthropic พบว่า agent "ชมงานตัวเองอย่างมั่นใจ" ทางแก้ไม่ใช่การอ้อนวอนใน prompt
แต่เป็น **การตรวจแบบ deterministic นอกโมเดล**: hook `Stop` และ `PostToolUse` ของ Claude Code รันการ
ตรวจแล้วป้อนผลกลับ แยก "คนทำ" ออกจาก "คนตรวจ"
*ที่มา: lecture 9; `harness-designs/claude-code/` หัวข้อ Feedback and Verification*

**[harness]** Gate กับ Rule (ดู CONTEXT.md) Gate ของเรา: stop gate, format hook, git guard
เมื่อ feedback จาก review ซ้ำ ให้ยก Rule เป็น Gate

## 8. การทดสอบ end-to-end เปลี่ยนผลลัพธ์

การตรวจนับเฉพาะเมื่อ flow ทั้งเส้นทำงาน ใส่คำสั่ง verify ไว้ใน spec (คือใน repo) ให้เป็นส่วนประกอบ
default ของ harness และเปลี่ยน feedback ที่ซ้ำให้เป็นกฎเชิงกล/linter
*ที่มา: lecture 10; `review-feedback-to-rule.md`*

## 9. Observability และ clean state

Log เป็น append-only และ replay ได้; session ทิ้ง handoff ที่ดีเพราะชั้น storage ทำให้มันถูก ไม่ใช่
เพราะความจำดี ทุก session จบใน clean state: startup ยังใช้ได้, verify ยังรันได้, บันทึก progress แล้ว,
feature state ซื่อตรง, ไม่มีขั้นครึ่ง ๆ กลาง ๆ ที่ไม่ได้บันทึก
*ที่มา: lecture 11–12; `clean-state-checklist.md`*

## 10. Loop และตัวประเมิน (maker / checker)

แยก **maker** (ทำงาน) จาก **checker** (ให้คะแนนด้วย rubric ตายตัวใน context สด) agent ตัดสินตัวเอง
ไม่เก่ง: ไล่ปัญหาเสร็จแล้วอนุมัติ ต้อง tune rubric เทียบกับคนจริง 3–5 รอบ และบันทึกทุกการเปลี่ยน
เก็บ **quality document** ที่ให้เกรด codebase ตามเวลา แยกจาก rubric รายเซสชัน
*ที่มา: lecture 13–14; `evaluator-rubric.md`, `quality-document.md`*

**[harness]** subagent `harness-evaluator` + rubric default ที่ `docs/evaluator-rubric.default.md`; override ต่อโปรเจ็กที่
`docs/harness/evaluator-rubric.md` สร้างเมื่อเริ่ม tune

## 11. Claude Code ในฐานะ harness (สิ่งที่เรารับมา)

1. แบ่งคำสั่งตาม scope 2. compaction แบบ lossless ก่อน lossy 3. ใช้ hook ตรวจแบบ deterministic
4. แยก context ของ subagent 5. session storage แบบ append และ replay ได้
การแบ่งหน้าที่: CLAUDE.md = *what*, Skills = *how*, MCP = *where to connect*, hooks = *when to
enforce* ผสมชั้นเหล่านี้แล้ว context จะรั่ว
*ที่มา: `harness-designs/claude-code/index.md`*

**[harness]** นี่คือเหตุผลที่ harness (what/when) แยก repo จาก agent-skills (how): ADR-0001

## 12. Codex ในฐานะ harness (สิ่งที่เรารับมา)

AGENTS.md เป็นหน้าสารบัญ; invariant ไม่ใช่การจุกจิก; worktree แยกต่อ task; คำสั่ง verify อยู่ใน
spec; กลยุทธ์ context **Write–Select–Compress–Isolate**
*ที่มา: `harness-designs/codex/index.md`*

## 13. ลดความซับซ้อนเมื่อโมเดลเก่งขึ้น

ทุกชิ้นของ harness แฝงสมมติฐานว่าโมเดลทำอะไรไม่ได้ เป็นระยะ: ถ่าย quality snapshot, ถอดชิ้นหนึ่งออก,
รัน benchmark, ถ่ายอีกครั้ง ถ้าเกรดไม่ตก ชิ้นนั้นคือ overhead
*ที่มา: `resources/templates/index.md` หัวข้อ Harness simplification tie-in*

## ต้นฉบับทั้งหมดอยู่ที่ไหน

`sources/learn-harness-engineering/docs-en/`: `lectures/` (14 บท), `harness-designs/` (Pi, Claude
Code, Codex, DeepSeek), `resources/templates/`, `resources/reference/`, `resources/openai-advanced/`
(โครง repo ขั้นสูงและ SOP), `projects/` (แบบฝึกหัด 8 ชิ้น) skill `harness-creator` อยู่ที่
`sources/learn-harness-engineering/skills/`
