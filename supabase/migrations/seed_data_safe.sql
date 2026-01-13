-- Safe seed data script (can be run multiple times)
-- Run this after combined_migration.sql

-- Seed Pillars
INSERT INTO pillars (id, name, description, color_thresholds, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'New Revenue & Market Expansion', 'Metrics tracking new business acquisition, pipeline growth, and market penetration', '{"green": 90, "yellow": 70}', 1),
  ('22222222-2222-2222-2222-222222222222', 'Customer Value & Expansion', 'Metrics tracking existing customer growth, upsells, and cross-sells', '{"green": 90, "yellow": 70}', 2),
  ('33333333-3333-3333-3333-333333333333', 'Retention & Customer Success', 'Metrics tracking customer retention, satisfaction, and health scores', '{"green": 90, "yellow": 70}', 3),
  ('44444444-4444-4444-4444-444444444444', 'Operational Excellence', 'Metrics tracking engineering velocity, quality, and operational efficiency', '{"green": 90, "yellow": 70}', 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color_thresholds = EXCLUDED.color_thresholds,
  sort_order = EXCLUDED.sort_order;

-- Seed Executives (7 team members)
INSERT INTO executives (id, name, title, headshot_url, email, sort_order) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Hank Seale', 'Chief Executive Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af86ee2da5ea768e794288_2024Hapax-Hank-KPP09626-Website.jpg', 'hank@hapax.ai', 1),
  ('aaaa2222-2222-2222-2222-222222222222', 'Jennifer Harris', 'Chief Financial Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6a72fdc5fcafa067_2024Hapax-Jennifer-KPP08852-Website.jpg', 'jennifer@hapax.ai', 2),
  ('aaaa3333-3333-3333-3333-333333333333', 'Kevin Green', 'Chief Marketing Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8aa671a041b4f7c52f_2024Hapax-Kevin-KPP08849-Website.jpg', 'kevin@hapax.ai', 3),
  ('aaaa4444-4444-4444-4444-444444444444', 'Aaron Kwan', 'Chief Revenue Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8ac0a816c3a5a4784b_2024Hapax-AaronKwan-Website.jpg', 'aaron@hapax.ai', 4),
  ('aaaa5555-5555-5555-5555-555555555555', 'Brian Huddleston', 'Chief Technology Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a1269b738944c73d4_2024Hapax-Brian-KPP08874-Website.jpg', 'brian@hapax.ai', 5),
  ('aaaa6666-6666-6666-6666-666666666666', 'Greg Varnell', 'Chief Product Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg', 'greg@hapax.ai', 6),
  ('aaaa7777-7777-7777-7777-777777777777', 'Connor Huddleston', 'Chief Strategy Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg', 'connor@hapax.ai', 7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  headshot_url = EXCLUDED.headshot_url,
  email = EXCLUDED.email,
  sort_order = EXCLUDED.sort_order;

-- Seed Key Result Metrics for each pillar
-- Pillar 1: New Revenue & Market Expansion
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pipeline Value', 'Total value of active sales pipeline', 2500000, 2400000, 2200000, 'up', 'key_result', 'currency', 'hubspot', 'at_or_above', 'monthly'),
  ('bbbb1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'New Customers', 'Number of new customers acquired this quarter', 15, 12, 10, 'up', 'key_result', 'number', 'hubspot', 'on_track', 'quarterly'),
  ('bbbb1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Win Rate', 'Percentage of opportunities won', 35, 32, 31, 'up', 'key_result', 'percentage', 'hubspot', 'at_or_above', 'monthly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Pillar 2: Customer Value & Expansion
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('bbbb2221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Net Revenue Retention', 'Revenue retention including expansions', 120, 115, 112, 'up', 'key_result', 'percentage', 'manual', 'at_or_above', 'monthly'),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Expansion Revenue', 'Revenue from existing customer expansions', 500000, 420000, 380000, 'up', 'key_result', 'currency', 'hubspot', 'on_track', 'quarterly'),
  ('bbbb2223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Customer Upsells', 'Number of successful upsell deals', 20, 14, 12, 'up', 'key_result', 'number', 'hubspot', 'on_track', 'quarterly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Pillar 3: Retention & Customer Success
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('bbbb3331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Customer Retention Rate', 'Percentage of customers retained', 95, 93, 92, 'up', 'key_result', 'percentage', 'manual', 'at_or_above', 'monthly'),
  ('bbbb3332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'NPS Score', 'Net Promoter Score', 50, 47, 45, 'up', 'key_result', 'number', 'manual', 'at_or_above', 'quarterly'),
  ('bbbb3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Support Response Time', 'Average first response time in hours (lower is better)', 2, 2.5, 3, 'up', 'key_result', 'number', 'manual', 'at_or_below', 'weekly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Pillar 4: Operational Excellence
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('bbbb4441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Sprint Velocity', 'Average story points completed per sprint', 50, 42, 38, 'up', 'key_result', 'number', 'jira', 'at_or_above', 'weekly'),
  ('bbbb4442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Bug Resolution Time', 'Average days to resolve bugs (lower is better)', 3, 4.2, 5, 'up', 'key_result', 'number', 'jira', 'at_or_below', 'weekly'),
  ('bbbb4443-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Deployment Frequency', 'Deployments per week', 10, 8, 6, 'up', 'key_result', 'number', 'jira', 'at_or_above', 'weekly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Seed Leading Indicators (child metrics for key results)
-- Leading indicators for Pipeline Value
INSERT INTO metrics (id, pillar_id, parent_metric_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'MQLs Generated', 'Marketing qualified leads this month', 200, 185, 170, 'up', 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly'),
  ('cccc1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Demo Requests', 'Number of demo requests', 40, 35, 30, 'up', 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly'),
  ('cccc1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Outbound Meetings', 'Outbound meetings booked', 60, 48, 45, 'up', 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Quality metrics for Pipeline Value
INSERT INTO metrics (id, pillar_id, parent_metric_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source, comparison_mode, cadence) VALUES
  ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Lead Quality Score', 'Average lead score', 80, 72, 68, 'up', 'quality', 'percentage', 'hubspot', 'at_or_above', 'monthly'),
  ('dddd1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Time to First Contact', 'Hours to first sales contact (lower is better)', 2, 2.3, 3.1, 'up', 'quality', 'number', 'hubspot', 'at_or_below', 'weekly')
ON CONFLICT (id) DO UPDATE SET
  current_value = EXCLUDED.current_value,
  previous_value = EXCLUDED.previous_value,
  trend_direction = EXCLUDED.trend_direction;

-- Assign metric owners (delete existing and re-insert)
DELETE FROM metric_owners WHERE metric_id IN (
  'bbbb1111-1111-1111-1111-111111111111',
  'bbbb1112-1111-1111-1111-111111111111',
  'bbbb1113-1111-1111-1111-111111111111',
  'bbbb2221-2222-2222-2222-222222222222',
  'bbbb2222-2222-2222-2222-222222222222',
  'bbbb2223-2222-2222-2222-222222222222',
  'bbbb3331-3333-3333-3333-333333333333',
  'bbbb3332-3333-3333-3333-333333333333',
  'bbbb3333-3333-3333-3333-333333333333',
  'bbbb4441-4444-4444-4444-444444444444',
  'bbbb4442-4444-4444-4444-444444444444',
  'bbbb4443-4444-4444-4444-444444444444'
);

INSERT INTO metric_owners (metric_id, executive_id) VALUES
  -- Pipeline Value owned by Aaron (CRO)
  ('bbbb1111-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444'),
  -- New Customers owned by Aaron (CRO) and Kevin (CMO)
  ('bbbb1112-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444'),
  ('bbbb1112-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333'),
  -- Win Rate owned by Aaron
  ('bbbb1113-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444'),
  -- NRR owned by Jennifer (CFO) and Aaron
  ('bbbb2221-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222'),
  ('bbbb2221-2222-2222-2222-222222222222', 'aaaa4444-4444-4444-4444-444444444444'),
  -- Expansion Revenue owned by Aaron
  ('bbbb2222-2222-2222-2222-222222222222', 'aaaa4444-4444-4444-4444-444444444444'),
  -- Customer Upsells owned by Aaron
  ('bbbb2223-2222-2222-2222-222222222222', 'aaaa4444-4444-4444-4444-444444444444'),
  -- Retention owned by Greg (CPO)
  ('bbbb3331-3333-3333-3333-333333333333', 'aaaa6666-6666-6666-6666-666666666666'),
  -- NPS owned by Greg
  ('bbbb3332-3333-3333-3333-333333333333', 'aaaa6666-6666-6666-6666-666666666666'),
  -- Support Response Time owned by Brian (CTO)
  ('bbbb3333-3333-3333-3333-333333333333', 'aaaa5555-5555-5555-5555-555555555555'),
  -- Sprint Velocity owned by Brian
  ('bbbb4441-4444-4444-4444-444444444444', 'aaaa5555-5555-5555-5555-555555555555'),
  -- Bug Resolution owned by Brian
  ('bbbb4442-4444-4444-4444-444444444444', 'aaaa5555-5555-5555-5555-555555555555'),
  -- Deployment Frequency owned by Brian
  ('bbbb4443-4444-4444-4444-444444444444', 'aaaa5555-5555-5555-5555-555555555555');

-- Sample commitments
INSERT INTO commitments (id, executive_id, metric_id, title, description, status, target_date) VALUES
  ('eeee1111-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444', 'bbbb1113-1111-1111-1111-111111111111', 'Implement new sales methodology', 'Roll out MEDDIC sales methodology to improve win rate', 'in_progress', '2025-02-15'),
  ('eeee2222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333', 'bbbb1112-1111-1111-1111-111111111111', 'Launch Q1 demand gen campaign', 'Execute integrated marketing campaign targeting financial institutions', 'in_progress', '2025-02-01'),
  ('eeee3333-3333-3333-3333-333333333333', 'aaaa5555-5555-5555-5555-555555555555', 'bbbb4441-4444-4444-4444-444444444444', 'Reduce technical debt', 'Dedicate 20% of sprint capacity to technical debt reduction', 'pending', '2025-03-01'),
  ('eeee4444-4444-4444-4444-444444444444', 'aaaa6666-6666-6666-6666-666666666666', 'bbbb3332-3333-3333-3333-333333333333', 'Customer feedback program', 'Implement systematic customer feedback collection', 'in_progress', '2025-02-28')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- Sample executive reports for current week
INSERT INTO executive_reports (executive_id, content, week_of) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'This week marked solid progress across our strategic initiatives, though we continue to navigate some headwinds in the operational efficiency pillar. Our pipeline growth has been exceptional, with the sales team closing two mid-market deals ahead of schedule and moving three enterprise opportunities into late-stage negotiations.

I''m particularly pleased with the cross-functional collaboration between Sales and Customer Success on the new onboarding framework. Early indicators suggest this will significantly improve our time-to-value metrics. The executive team met on Wednesday to review Q1 progress, and we''re on track for 92% of our quarterly targets.

Key priorities for next week include finalizing the enterprise deal with Acme Corp, launching our revamped customer health scoring system, and addressing the engineering velocity concerns that Brian will elaborate on in his update.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa4444-4444-4444-4444-444444444444', 'Revenue performance this week exceeded expectations, with the sales organization delivering strong results across both new business and expansion motions. We closed $340K in new ARR, bringing our Q1 total to $1.2M against a target of $1.5M. With six weeks remaining, I''m confident we''ll hit our number.

The enterprise segment continues to be our growth engine. The Acme Corp deal ($180K ARR) is in final contract review, and we expect signatures by end of next week. Additionally, our expansion pipeline has grown 23% month-over-month, driven by strong product adoption within our customer base.

Areas requiring attention include our SMB conversion rates, which dropped 8% this month. I''m working with Kevin to analyze whether this is a lead quality issue or a sales process gap.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa3333-3333-3333-3333-333333333333', 'Marketing delivered a strong week with our Q1 demand generation campaign going live on Monday. Early performance indicators are encouraging—we''re seeing a 34% open rate on our email sequences (up from 28% benchmark) and website traffic has increased 45% week-over-week.

Content production is on track with three new case studies published and our thought leadership webinar series scheduled through March. Our partnership with the industry analyst firm has resulted in positive coverage that''s driving inbound inquiries from enterprise prospects.

The primary challenge remains lead quality in the SMB segment. I''ve implemented new scoring criteria and am working closely with Aaron''s team to tighten our ideal customer profile definition.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa5555-5555-5555-5555-555555555555', 'Engineering made progress on several fronts this week, though our velocity metrics remain below where we''d like them to be. We shipped the new dashboard analytics feature on schedule, which has received positive feedback from beta customers. The platform stability improvements deployed last sprint have reduced our p95 latency by 28%.

The velocity gap is primarily driven by two factors: increased support escalations from the recent customer growth and accumulated technical debt in our authentication module. I''ve reallocated two senior engineers to a focused tech debt reduction initiative.

On the positive side, our new monitoring and alerting infrastructure is fully operational, reducing our mean time to detection from 12 minutes to under 2 minutes.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa6666-6666-6666-6666-666666666666', 'Product had a productive week focused on customer discovery and roadmap refinement. We completed 8 customer interviews as part of our Jobs-to-Be-Done research, and the insights are reshaping our Q2 priorities. Customers are consistently asking for deeper analytics capabilities and more flexible workflow automation.

Our NPS tracking automation went live on Tuesday, and we''re already seeing a 40% increase in survey response rates compared to our previous manual process. Current NPS stands at 42, up from 38 last quarter, with enterprise customers rating us at 52.

The new customer health scoring model is in final testing and will roll out next week, giving Customer Success much better leading indicators for churn risk.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa2222-2222-2222-2222-222222222222', 'Finance completed several key initiatives this week that strengthen our operational foundation. We closed the books on January ahead of schedule, with revenue recognition accuracy at 99.7%. Cash collections improved significantly—DSO dropped from 42 days to 36 days.

The Q1 forecast has been updated based on pipeline and bookings data through last week. We''re projecting to finish the quarter at 104% of revenue target, assuming the enterprise deals in late stage close as expected.

On the operational efficiency front, we''ve identified $180K in annual cost savings through vendor consolidation and process automation. These savings will offset the incremental headcount investments planned for Q2.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER),
  ('aaaa7777-7777-7777-7777-777777777777', 'Strategy and Operations focused this week on synthesizing cross-functional performance data and identifying optimization opportunities. The executive dashboard we''ve been building is now tracking all four strategic pillars in real-time, giving leadership unprecedented visibility into company health.

The strategic planning offsite scheduled for next month is fully planned. We''ll be reviewing our three-year vision, validating market assumptions, and pressure-testing our go-to-market strategy against emerging competitive dynamics.

My analysis of our operational metrics revealed an interesting correlation: teams that have adopted our new goal-setting framework are showing 25% better metric performance than those still using legacy processes.', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER)
ON CONFLICT (executive_id, week_of) DO UPDATE SET
  content = EXCLUDED.content;

SELECT 'Seed data loaded successfully!' as status;
