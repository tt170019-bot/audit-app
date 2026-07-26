const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');

const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(require.resolve('../checklist-source.js'), 'utf8'), context);
const source = context.globalThis.ChecklistSource;

async function main(){
  // wayfinder #8 — Supabase 익명 읽기: row is already parsed (no xlsx step),
  // and must carry the item-level scale assignment/guidance + template-level
  // scale library through untouched.
  const fakeClient = {
    selectAll: async (table) => {
      assert.equal(table, 'templates');
      return [
        {
          id: 'row-1',
          name: '현장 점검표',
          maturity_scales: [{ id: 'sA', name: '숙련도', labels: ['입문', '숙련'] }],
          created_by: 'user-a',
          updated_by: 'user-b',
          updated_at: '2026-07-01T00:00:00.000Z',
          items: [
            { section: '운항', question: '절차가 있는가?', maturityScaleIds: ['sA'], maturityGuidance: { sA: ['입문 안내'] } },
            { section: '운항', question: '기록이 있는가?', maturityScaleIds: [] }
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
  assert.deepEqual(t.maturityScales, [{ id: 'sA', name: '숙련도', labels: ['입문', '숙련'] }]);
  assert.equal(t.createdBy, 'user-a');
  assert.equal(t.updatedBy, 'user-b');
  assert.equal(t.items.length, 2);
  assert.deepEqual(t.items[0].maturityScaleIds, ['sA'], '항목별 척도 배정이 보존되어야 합니다');
  assert.deepEqual(t.items[0].maturityGuidance, { sA: ['입문 안내'] }, '항목별 안내문이 보존되어야 합니다');
  assert.deepEqual(t.items[1].maturityScaleIds, [], '척도가 배정되지 않은 항목은 빈 배열이어야 합니다');
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
      items: [{ section:'운항', question:'Q1', maturityScaleIds:['sA'] }],
      maturityScales: [{ id:'sA', name:'등급', labels:['A','B'] }],
      revisionNo: '1', revisionDate: '2026-01-01'
    });
    assert.equal(insertedTable, 'templates');
    assert.equal(insertedToken, 'access-token-1');
    assert.equal(insertedRow.created_by, 'user-1');
    assert.equal(insertedRow.updated_by, 'user-1');
    assert.equal(insertedRow.revision_no, 1, '개정번호는 정수로 저장되어야 합니다');
    assert.equal(insertedRow.revision_date, '2026-01-01');
    assert.equal(saved.name, '새 점검표');
    assert.equal(saved.source, 'supabase');
    assert.equal(saved.supabaseId, 'new-row');
    assert.deepEqual(saved.maturityScales, [{ id:'sA', name:'등급', labels:['A','B'] }]);

    let updatedId, updatedRow;
    const updateClient = {
      update: async (table, id, patch) => {
        updatedId = id; updatedRow = patch;
        return { id, name: patch.name, items: patch.items, sections: patch.sections, maturity_scales: patch.maturity_scales, revision_no: patch.revision_no, revision_date: patch.revision_date, created_by: 'user-1', updated_by: patch.updated_by, updated_at: patch.updated_at };
      }
    };
    const updated = await source.updateSupabaseTemplate(updateClient, 'access-token-2', 'user-2', 'existing-row', {
      name: '수정된 점검표', sections: ['운항'], items: [{ section:'운항', question:'Q1', maturityScaleIds:[] }], maturityScales: [],
      revisionNo: '2', revisionDate: '2026-07-01'
    });
    assert.equal(updatedId, 'existing-row');
    assert.equal(updatedRow.updated_by, 'user-2');
    assert.deepEqual(updatedRow.maturity_scales, [], '척도를 전부 지운 경우에도 배열은 항상 써야 합니다 (레거시 폴백 차단)');
    assert.ok(updatedRow.updated_at, '수정 시 updated_at을 직접 채워야 합니다');
    assert.equal(updated.name, '수정된 점검표');
    assert.equal(updated.supabaseId, 'existing-row');
    assert.equal(updated.revisionNo, 2);
    assert.equal(updated.revisionDate, '2026-07-01');

    await source.updateSupabaseTemplate(updateClient, 'access-token-2', 'user-2', 'existing-row', {
      name: '수정된 점검표', sections: ['운항'], items: [{ section:'운항', question:'Q1', maturityScaleIds:[] }], maturityScales: [],
      revisionNo: '', revisionDate: ''
    });
    assert.equal(updatedRow.revision_no, null, '빈 개정번호는 null로 저장되어야 합니다');
  }

  // ADR-0002 — loadTemplateRevisions is a read-only view of the snapshots the
  // DB trigger writes; it must filter by template_id and order newest-first.
  {
    let capturedTable, capturedQuery;
    const revisionsClient = {
      selectAll: async (table, query) => {
        capturedTable = table; capturedQuery = query;
        return [{
          id: 9, template_id: 'existing-row', name: '수정 전 점검표',
          sections: ['운항'], items: [{ section:'운항', question:'Q1', maturityScaleIds:['sA'] }],
          maturity_scales: [{ id:'sA', name:'등급', labels:['A','B'] }],
          revision_no: 1, revision_date: '2026-01-01',
          updated_by: 'user-1', updated_at: '2026-07-01T00:00:00.000Z', created_at: '2026-07-20T00:00:00.000Z'
        }];
      }
    };
    const revisions = await source.loadTemplateRevisions(revisionsClient, 'existing-row');
    assert.equal(capturedTable, 'template_revisions');
    assert.equal(capturedQuery, 'template_id=eq.existing-row&order=created_at.desc');
    assert.equal(revisions.length, 1);
    assert.equal(revisions[0].templateId, 'existing-row');
    assert.equal(revisions[0].name, '수정 전 점검표');
    assert.deepEqual(revisions[0].maturityScales, [{ id:'sA', name:'등급', labels:['A','B'] }]);
    assert.equal(revisions[0].revisionNo, 1);
    assert.equal(revisions[0].revisionDate, '2026-01-01');
  }

  console.log('checklist source tests passed');
}

main().catch(e => { console.error(e); process.exit(1); });
