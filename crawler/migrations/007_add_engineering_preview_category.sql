INSERT OR IGNORE INTO dict_notice_category (category_num, category_name, sort_order) VALUES
  ('002001010', '招标文件预公示', 2);

UPDATE dict_notice_category
SET sort_order = 3
WHERE category_num = '002001001' AND COALESCE(sort_order, 0) < 3;

UPDATE dict_notice_category
SET sort_order = 4
WHERE category_num = '002002001' AND COALESCE(sort_order, 0) < 4;

UPDATE dict_notice_category
SET sort_order = 5
WHERE category_num = '59' AND COALESCE(sort_order, 0) < 5;

UPDATE dict_notice_category
SET sort_order = 6
WHERE category_num = '00101' AND COALESCE(sort_order, 0) < 6;
