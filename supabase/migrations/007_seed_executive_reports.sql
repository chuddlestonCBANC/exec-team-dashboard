-- Migration: Seed Executive Reports
-- Add sample multi-paragraph reports for each executive for the current week

DO $$
DECLARE
  current_week DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  exec_record RECORD;
BEGIN
  -- Loop through all executives and create reports
  FOR exec_record IN SELECT id, name, title FROM executives ORDER BY sort_order LOOP
    INSERT INTO executive_reports (executive_id, week_of, content)
    VALUES (
      exec_record.id,
      current_week,
      CASE exec_record.title
        WHEN 'CEO' THEN
'This week marked significant progress on our strategic initiatives. I focused on aligning the executive team around Q1 priorities and strengthening key partnerships.

Our board prep is well underway with materials due next week. Met with two potential strategic partners who could accelerate our enterprise expansion. Both conversations were productive and we have follow-up meetings scheduled.

I dedicated time this week to customer conversations, joining calls with three of our largest accounts. The feedback on our product roadmap was overwhelmingly positive, though we identified some gaps in our enterprise features that Greg and the product team are addressing.

Key priorities for next week: finalize board materials, close the partnership discussion with TechCorp, and participate in the leadership offsite planning.'

        WHEN 'CFO' THEN
'Finance closed out the month with strong numbers. Revenue came in 3% above forecast, primarily driven by better-than-expected expansion revenue from existing customers.

Cash position remains strong at $12.4M with 18 months of runway at current burn. We completed the annual audit prep work ahead of schedule, which will help us meet our board timeline.

I worked closely with Aaron on pipeline analysis this week. We identified opportunities to improve our forecasting accuracy by incorporating more leading indicators from the sales process. Implementing new reporting starting next week.

Collections improved this quarter - DSO is down to 42 days from 51 last quarter. Continuing to monitor a few larger accounts that are approaching payment terms.'

        WHEN 'CMO' THEN
'Marketing delivered strong results this week with MQL volume up 22% compared to last week. Our new content campaign on AI implementation is resonating well with target accounts.

The team launched our updated website messaging, which better articulates our value proposition for enterprise buyers. Early engagement metrics look promising - time on site is up 35% and demo requests from organic traffic increased.

Brand awareness campaign planning is complete. We secured three speaking slots at industry conferences in Q2 and have begun podcast outreach. Building a more systematic approach to thought leadership.

Next week focus: finalize Q2 campaign calendar, complete marketing attribution analysis, and align with sales on MQL qualification criteria improvements.'

        WHEN 'CRO' THEN
'Sales team had an excellent week. We closed two enterprise deals totaling $380K ARR, both above our average deal size. Pipeline coverage remains healthy at 4.2x quota.

I spent significant time this week on deal coaching with the team. We have three $100K+ opportunities in final negotiations that should close before month end. Each has executive sponsorship and procurement engagement.

Working closely with Kevin on improving our lead handoff process. We identified friction points causing delays in initial outreach. Implementing a new SLA framework starting Monday.

Hiring update: extended offers to two senior AEs this week. Both accepted. This brings us to full headcount for Q1 and positions us well for Q2 growth targets.'

        WHEN 'CTO' THEN
'Engineering had a productive sprint with 94% of committed points delivered. We shipped the new analytics dashboard feature and addressed several P1 bugs from the customer feedback queue.

Infrastructure work continues on schedule. The database migration to Aurora is 70% complete and we are on track for the EOQ deadline. Performance improvements are already visible in staging - p99 latency is down 40%.

Security review completed for the new SSO feature. One critical finding addressed this week, remainder scheduled for the next sprint. No blockers for the planned release date.

Technical debt reduction initiative launched. Allocated 20% of sprint capacity to address the highest-impact items. Will provide metrics on velocity improvement in 4 weeks.'

        WHEN 'CPO' THEN
'Product delivered several key features this week. The new reporting module is now in beta with 5 customers providing feedback. Initial response has been very positive.

We finalized the Q2 roadmap during Thursday''s planning session. Priorities align with our strategic pillars: enterprise capabilities, user engagement, and platform reliability. Published the updated roadmap to the customer advisory board.

Customer research continues to inform our direction. Completed 12 user interviews this week focusing on workflow automation needs. Clear patterns emerging that will shape our automation feature design.

Working with Brian on improving our release process. Goal is to move from bi-weekly to weekly releases by end of Q2. Technical foundations are in place, focusing now on process improvements.'

        WHEN 'CSO' THEN
'Strategy team made good progress on competitive analysis and market sizing work. Completed deep dive on two new competitors entering our space.

Finalized the partner strategy framework. Identified three tiers of partnerships with clear criteria and engagement models for each. Presenting to exec team next week for feedback.

OKR refresh session with leadership was productive. All teams have draft Q2 OKRs ready for review. Planning calibration session for next Tuesday.

Board deck content is 80% complete. Working with Jennifer on financial narratives and with Hank on strategic positioning. On track for submission deadline.'

        ELSE
'This week my team focused on execution against our quarterly priorities. We made solid progress on key initiatives and addressed several blockers that had been impacting velocity.

Cross-functional collaboration continues to improve. Participated in multiple planning sessions with other teams to ensure alignment on shared objectives and dependencies.

Looking ahead, next week will focus on accelerating delivery on our highest-priority items while maintaining quality standards. Team capacity is healthy and morale is good.

Key meetings scheduled include the leadership sync, department planning, and several customer-facing commitments.'
      END
    )
    ON CONFLICT (executive_id, week_of) DO UPDATE SET
      content = EXCLUDED.content;
  END LOOP;
END $$;

SELECT 'Executive reports seeded successfully!' as status;
