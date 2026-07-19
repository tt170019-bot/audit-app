const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../checklist-source.js'), 'utf8'), context);
const source = context.globalThis.ChecklistSource;

const rows = source.extractRows([
  ['Section', 'No.', 'Question'],
  ['운항', 'ORG 1.1.1', '절차가 있는가?', 'INT-1'],
  ['운항', 'ORG 1.1.2', ''],
]);

assert.equal(rows.length, 1);
assert.equal(rows[0].section, '운항');
assert.equal(rows[0].ref, 'ORG 1.1.1');
assert.equal(rows[0].type, 'YES/NO/OBS/N/A');

async function main(){
  // wayfinder #8 — Supabase 익명 읽기: row is already parsed (no xlsx step),
  // and must carry the item-level maturity flag + custom scale through untouched.
  const fakeClient = {
    selectAll: async (table) => {
      assert.equal(table, 'templates');
      return [
        {
          id: 'row-1',
          name: '현장 점검표',
          maturity_scale: { name: '숙련도', labels: ['입문', '숙련'] },
          created_by: 'user-a',
          updated_by: 'user-b',
          updated_at: '2026-07-01T00:00:00.000Z',
          items: [
            { section: '운항', question: '절차가 있는가?', maturityOn: true, maturity: '입문' },
            { section: '운항', question: '기록이 있는가?', maturityOn: false }
          ]
        },
        { id: 'row-2', name: '빈 항목', items: [] } // no items → dropped
      ];
    }
  };

  const templates = await source.loadSupabaseTemplates(fakeClient);
  assert.equal(templates.length, 1, '항목이 없는 행은 목록에서 제외되어야 합니다');

  const t = templates[0];
  assert.equal(t.name, '현장 점검표');
  assert.equal(t.source, 'supabase');
  assert.equal(t.supabaseId, 'row-1');
  assert.equal(t.templateKey, 'supabase:row-1@@2026-07-01T00:00:00.000Z');
  assert.deepEqual(t.maturityScale, { name: '숙련도', labels: ['입문', '숙련'] });
  assert.equal(t.createdBy, 'user-a');
  assert.equal(t.updatedBy, 'user-b');
  assert.equal(t.items.length, 2);
  assert.equal(t.items[0].maturityOn, true, '항목별 성숙도 플래그가 보존되어야 합니다');
  assert.equal(t.items[1].maturityOn, false, '항목별 성숙도 플래그가 보존되어야 합니다');
  assert.equal(t.sections.length, 1, 'sections가 없으면 items에서 유도해야 합니다');
  assert.equal(t.sections[0], '운항');

  console.log('checklist source tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
