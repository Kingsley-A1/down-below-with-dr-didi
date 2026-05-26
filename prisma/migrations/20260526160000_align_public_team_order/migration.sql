-- Align existing production team records with the intended public/admin hierarchy.
UPDATE "TeamMember"
SET
  "tier" = 'core',
  "sortOrder" = CASE "slug"
    WHEN 'mrs-glory-victor-etienem' THEN 1
    WHEN 'mr-etoma-eugene' THEN 2
    WHEN 'mrs-ebani-clarkson-agbor' THEN 3
    WHEN 'mrs-gift-bunchi-abang' THEN 4
    ELSE "sortOrder"
  END
WHERE "slug" IN (
  'mrs-glory-victor-etienem',
  'mr-etoma-eugene',
  'mrs-ebani-clarkson-agbor',
  'mrs-gift-bunchi-abang'
);
