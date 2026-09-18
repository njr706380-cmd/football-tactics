# Video Tactical Analyzer — Master Plan

> **Status:** Phase 1 — Planning
> **Owner:** Football Tactics
> **Created:** 2026-09-18

---

## 1. الهدف

بناء نظام تحليل فيديو تكتيكي للاعبي eFootball، يستقبل Gameplay
ويُخرج تقريرًا منظمًا: أخطاء، قرارات، حلول، نصائح تدريبية.

---

## 2. المبدأ الأساسي

لا نستخدم AI لمشاهدة الفيديو وكتابة نص عشوائي.

نستخدم Pipeline حقيقي:

VIDEO → FRAMES → VISION AI → TACTICAL ENGINE → AI COACH → JSON

---

## 3. المعمارية
