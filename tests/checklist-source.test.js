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

  // wayfinder #11 — registering/updating a template stamps created_by/updated_by
  // and writes through the caller's access token, then normalizes the saved row
  // back into the same shape loadSupabaseTemplates() produces.
  {
    let insertedTable, insertedRow, insertedToken;
    const insertClient = {
      insert: async (table, row, accessToken) => {
        insertedTable = table; insertedRow = row; insertedToken = accessToken;
        return { id: 'new-row', ...row, created_at: '2026-07-19T00:00:00.000Z', updated_at: '2026-07-19T00:00:00.000Z' };
      }
    };
    const saved = await source.registerSupabaseTemplate(insertClient, 'access-token-1', 'user-1', {
      name: '새 점검표', filename: 'a.xlsx', sections: ['운항'],
      items: [{ section:'운항', question:'Q1', maturityOn:true }],
      maturityScale: { name:'등급', labels:['A','B'] }
    });
    assert.equal(insertedTable, 'templates');
    assert.equal(insertedToken, 'access-token-1');
    assert.equal(insertedRow.created_by, 'user-1');
    assert.equal(insertedRow.updated_by, 'user-1');
    assert.equal(saved.name, '새 점검표');
    assert.equal(saved.source, 'supabase');
    assert.equal(saved.supabaseId, 'new-row');
    assert.deepEqual(saved.maturityScale, { name:'등급', labels:['A','B'] });

    let updatedId, updatedRow;
    const updateClient = {
      update: async (table, id, patch) => {
        updatedId = id; updatedRow = patch;
        return { id, name: patch.name, items: patch.items, sections: patch.sections, maturity_scale: patch.maturity_scale, created_by: 'user-1', updated_by: patch.updated_by, updated_at: patch.updated_at };
      }
    };
    const updated = await source.updateSupabaseTemplate(updateClient, 'access-token-2', 'user-2', 'existing-row', {
      name: '수정된 점검표', sections: ['운항'], items: [{ section:'운항', question:'Q1', maturityOn:false }], maturityScale: null
    });
    assert.equal(updatedId, 'existing-row');
    assert.equal(updatedRow.updated_by, 'user-2');
    assert.ok(updatedRow.updated_at, '수정 시 updated_at을 직접 채워야 합니다');
    assert.equal(updated.name, '수정된 점검표');
    assert.equal(updated.supabaseId, 'existing-row');
  }

  console.log('checklist source tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
