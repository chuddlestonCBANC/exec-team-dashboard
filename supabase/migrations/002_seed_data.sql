-- Seed Pillars
INSERT INTO pillars (id, name, description, color_thresholds, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'New Revenue & Market Expansion', 'Metrics tracking new business acquisition, pipeline growth, and market penetration', '{"green": 90, "yellow": 70}', 1),
  ('22222222-2222-2222-2222-222222222222', 'Customer Value & Expansion', 'Metrics tracking existing customer growth, upsells, and cross-sells', '{"green": 90, "yellow": 70}', 2),
  ('33333333-3333-3333-3333-333333333333', 'Retention & Customer Success', 'Metrics tracking customer retention, satisfaction, and health scores', '{"green": 90, "yellow": 70}', 3),
  ('44444444-4444-4444-4444-444444444444', 'Operational Excellence', 'Metrics tracking engineering velocity, quality, and operational efficiency', '{"green": 90, "yellow": 70}', 4);

-- Seed Executives (7 team members)
INSERT INTO executives (id, name, title, headshot_url, email, sort_order) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Hank Seale', 'Chief Executive Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af86ee2da5ea768e794288_2024Hapax-Hank-KPP09626-Website.jpg', 'hank@hapax.ai', 1),
  ('aaaa2222-2222-2222-2222-222222222222', 'Jennifer Harris', 'Chief Financial Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6a72fdc5fcafa067_2024Hapax-Jennifer-KPP08852-Website.jpg', 'jennifer@hapax.ai', 2),
  ('aaaa3333-3333-3333-3333-333333333333', 'Kevin Green', 'Chief Marketing Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8aa671a041b4f7c52f_2024Hapax-Kevin-KPP08849-Website.jpg', 'kevin@hapax.ai', 3),
  ('aaaa4444-4444-4444-4444-444444444444', 'Aaron Kwan', 'Chief Revenue Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8ac0a816c3a5a4784b_2024Hapax-AaronKwan-Website.jpg', 'aaron@hapax.ai', 4),
  ('aaaa5555-5555-5555-5555-555555555555', 'Brian Huddleston', 'Chief Technology Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a1269b738944c73d4_2024Hapax-Brian-KPP08874-Website.jpg', 'brian@hapax.ai', 5),
  ('aaaa6666-6666-6666-6666-666666666666', 'Greg Varnell', 'Chief Product Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg', 'greg@hapax.ai', 6),
  ('aaaa7777-7777-7777-7777-777777777777', 'Connor Huddleston', 'Chief Strategy Officer', 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg', 'connor@hapax.ai', 7);

-- Seed Key Result Metrics for each pillar
-- Pillar 1: New Revenue & Market Expansion
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pipeline Value', 'Total value of active sales pipeline', 2500000, 2400000, 2200000, 'up', 'key_result', 'currency', 'hubspot'),
  ('bbbb1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'New Customers', 'Number of new customers acquired this quarter', 15, 12, 10, 'up', 'key_result', 'number', 'hubspot'),
  ('bbbb1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Win Rate', 'Percentage of opportunities won', 35, 32, 31, 'up', 'key_result', 'percentage', 'hubspot');

-- Pillar 2: Customer Value & Expansion
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('bbbb2221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Net Revenue Retention', 'Revenue retention including expansions', 120, 115, 112, 'up', 'key_result', 'percentage', 'manual'),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Expansion Revenue', 'Revenue from existing customer expansions', 500000, 420000, 380000, 'up', 'key_result', 'currency', 'hubspot'),
  ('bbbb2223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Customer Upsells', 'Number of successful upsell deals', 20, 14, 12, 'up', 'key_result', 'number', 'hubspot');

-- Pillar 3: Retention & Customer Success
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('bbbb3331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Customer Retention Rate', 'Percentage of customers retained', 95, 93, 92, 'up', 'key_result', 'percentage', 'manual'),
  ('bbbb3332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'NPS Score', 'Net Promoter Score', 50, 47, 45, 'up', 'key_result', 'number', 'manual'),
  ('bbbb3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Support Response Time', 'Average first response time in hours', 2, 2.5, 3, 'up', 'key_result', 'number', 'manual');

-- Pillar 4: Operational Excellence
INSERT INTO metrics (id, pillar_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('bbbb4441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Sprint Velocity', 'Average story points completed per sprint', 50, 42, 38, 'up', 'key_result', 'number', 'jira'),
  ('bbbb4442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Bug Resolution Time', 'Average days to resolve bugs', 3, 4.2, 5, 'up', 'key_result', 'number', 'jira'),
  ('bbbb4443-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Deployment Frequency', 'Deployments per week', 10, 8, 6, 'up', 'key_result', 'number', 'jira');

-- Seed Leading Indicators (child metrics for key results)
-- Leading indicators for Pipeline Value
INSERT INTO metrics (id, pillar_id, parent_metric_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'MQLs Generated', 'Marketing qualified leads this month', 200, 185, 170, 'up', 'leading_indicator', 'number', 'hubspot'),
  ('cccc1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Demo Requests', 'Number of demo requests', 40, 35, 30, 'up', 'leading_indicator', 'number', 'hubspot'),
  ('cccc1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Outbound Meetings', 'Outbound meetings booked', 60, 48, 45, 'up', 'leading_indicator', 'number', 'hubspot');

-- Quality metrics for Pipeline Value
INSERT INTO metrics (id, pillar_id, parent_metric_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Lead Quality Score', 'Average lead score', 80, 72, 68, 'up', 'quality', 'percentage', 'hubspot'),
  ('dddd1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'Time to First Contact', 'Hours to first sales contact', 2, 2.3, 3.1, 'up', 'quality', 'number', 'hubspot');

-- Leading indicators for Sprint Velocity
INSERT INTO metrics (id, pillar_id, parent_metric_id, name, description, target_value, current_value, previous_value, trend_direction, metric_type, format, data_source) VALUES
  ('cccc4441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'bbbb4441-4444-4444-4444-444444444444', 'Stories Completed', 'Number of stories completed per sprint', 25, 21, 18, 'up', 'leading_indicator', 'number', 'jira'),
  ('cccc4442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'bbbb4441-4444-4444-4444-444444444444', 'Sprint Commitment', 'Points committed at sprint start', 55, 48, 45, 'up', 'leading_indicator', 'number', 'jira'),
  ('cccc4443-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'bbbb4441-4444-4444-4444-444444444444', 'Carry Over Rate', 'Percentage of stories carried over', 10, 15, 20, 'up', 'leading_indicator', 'percentage', 'jira');

-- Assign metric owners
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
  ('eeee4444-4444-4444-4444-444444444444', 'aaaa6666-6666-6666-6666-666666666666', 'bbbb3332-3333-3333-3333-333333333333', 'Customer feedback program', 'Implement systematic customer feedback collection', 'in_progress', '2025-02-28');

-- Sample commitment updates
INSERT INTO commitment_updates (commitment_id, executive_id, content) VALUES
  ('eeee1111-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444', 'Completed training sessions for the sales team. Moving to implementation phase.'),
  ('eeee1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Good progress. How are we tracking adoption rates?'),
  ('eeee2222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333', 'Campaign assets finalized. Launching email sequence next week.');

-- Sample narratives
INSERT INTO narratives (metric_id, executive_id, content) VALUES
  ('bbbb1113-1111-1111-1111-111111111111', 'aaaa4444-4444-4444-4444-444444444444', 'Win rate has been improving due to better qualification in early stages. The new MEDDIC methodology is helping identify deal risks earlier.'),
  ('bbbb4441-4444-4444-4444-444444444444', 'aaaa5555-5555-5555-5555-555555555555', 'Velocity has been impacted by unplanned work from production issues. Implementing better monitoring to reduce interrupt-driven work.');
