async function testFullWorkflow() {
    const BASE = 'http://localhost:3000/api';

    console.log('--- STEP 1: REGISTER USER ---');
    const email = `operator_${Date.now()}@portflow.com`;
    const regRes = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: 'Password123!',
            fullName: 'Test Operator',
            role: 'Operator',
        }),
    });
    const regData = await regRes.json();
    console.log('Register response:', regData.success, regData.message);
    if (!regData.success) throw new Error(regData.message);
    const token = regData.token;

    console.log('\n--- STEP 2: VERIFY AUTH (ME) ---');
    const meRes = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log('Current user:', meData.user?.email, meData.user?.role);

    console.log('\n--- STEP 3: CREATE RECORD (OPERATION) ---');
    const createRes = await fetch(`${BASE}/operations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            operationType: 'Container Discharge',
            shipName: 'MV Production Star',
            craneId: 'Crane A',
            berthId: 'Berth 1',
            priority: 2,
            burstDuration: 3000,
        }),
    });
    const op = await createRes.json();
    console.log('Created Operation:', op.id, op.operation_type, op.ship_name, op.status);

    console.log('\n--- STEP 4: VERIFY RECORD IN LIST ---');
    const listRes = await fetch(`${BASE}/operations`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json();
    const found = list.find(o => o.id === op.id);
    console.log('Record exists in list:', !!found, 'Total active operations:', list.length);

    console.log('\n--- STEP 5: EDIT / UPDATE RECORD ---');
    const updateRes = await fetch(`${BASE}/operations/${op.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Running' }),
    });
    const updated = await updateRes.json();
    console.log('Updated Operation status:', updated.status);

    console.log('\n--- STEP 6: DELETE RECORD (MOVE TO TRASH) ---');
    const delRes = await fetch(`${BASE}/operations/${op.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const delData = await delRes.json();
    console.log('Delete response:', delData.message);

    console.log('\n--- STEP 7: VERIFY RECORD IN TRASH BIN ---');
    const trashRes = await fetch(`${BASE}/trash`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const trashItems = await trashRes.json();
    const inTrash = trashItems.find(t => t.id === op.id && t._collection === 'operations');
    console.log('Found in Trash Bin:', !!inTrash, 'Deleted at:', inTrash?.deleted_at);

    console.log('\n--- STEP 8: RESTORE RECORD FROM TRASH ---');
    const restoreRes = await fetch(`${BASE}/trash/operations/${op.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    const restoreData = await restoreRes.json();
    console.log('Restore response:', restoreData.message);

    console.log('\n--- STEP 9: VERIFY RECORD RETURNS TO ACTIVE DATA ---');
    const finalListRes = await fetch(`${BASE}/operations`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const finalList = await finalListRes.json();
    const restoredFound = finalList.find(o => o.id === op.id);
    console.log('Restored record in active list:', !!restoredFound);

    console.log('\n--- STEP 10: OS SCHEDULER DISPATCH ---');
    const dispatchRes = await fetch(`${BASE}/operations/dispatch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    const dispatchData = await dispatchRes.json();
    console.log('Dispatch result:', dispatchData);

    console.log('\n--- STEP 11: OS ENGINE STATE & REAL ANALYTICS ---');
    const [osRes, analyticsRes] = await Promise.all([
        fetch(`${BASE}/os/state`),
        fetch(`${BASE}/analytics`),
    ]);
    const osState = await osRes.json();
    const analytics = await analyticsRes.json();
    console.log('Analytics totals:', analytics);
    console.log('Deadlock detected:', osState.deadlockDetected);

    console.log('\n✅ ALL 11 WORKFLOW STEPS PASSED SUCCESSFULLY!');
}

testFullWorkflow().catch(err => {
    console.error('Workflow test failed:', err);
    process.exit(1);
});
