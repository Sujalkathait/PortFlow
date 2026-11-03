import { BillingService } from '../billing.service';

describe('BillingService Unit Tests', () => {
    let billingService: BillingService;

    beforeEach(() => {
        billingService = new BillingService();
    });

    test('should retrieve initial list of bills', async () => {
        const bills = await billingService.getBills();
        expect(Array.isArray(bills)).toBe(true);
        expect(bills.length).toBeGreaterThanOrEqual(2);
        expect(bills[0]).toHaveProperty('invoice_number');
    });

    test('should automatically generate a bill when an operation completes', async () => {
        const mockOperation = {
            id: 991,
            ship_name: 'Ever Given',
            operation_type: 'Cargo Discharge',
            crane_id: 'Crane Alpha',
            cargo_id: 42,
            status: 'Completed',
        };

        const generatedBill = await billingService.generateBillForOperation(mockOperation);
        expect(generatedBill).toBeDefined();
        expect(generatedBill.operation_id).toBe(991);
        expect(generatedBill.customer_name).toContain('Ever Given');
        expect(generatedBill.docking_fee).toBe(1250.0);
        expect(generatedBill.crane_usage_fee).toBe(850.0); // has crane
        expect(generatedBill.storage_fee).toBe(350.0); // has cargo
        expect(generatedBill.total_amount).toBe(2450.0); // 1250 + 850 + 350
        expect(generatedBill.payment_status).toBe('Pending');
        expect(generatedBill.invoice_number).toMatch(/^INV-\d{4}-\d+/);

        // Verify it is returned in getBills
        const allBills = await billingService.getBills();
        const found = allBills.find(b => b.invoice_number === generatedBill.invoice_number);
        expect(found).toBeDefined();
    });

    test('should not generate duplicate bills for the same operation', async () => {
        const mockOp = {
            id: 992,
            ship_name: 'MSC Oscar',
            operation_type: 'Berthing',
            crane_id: 'None',
            status: 'Completed',
        };

        const bill1 = await billingService.generateBillForOperation(mockOp);
        const bill2 = await billingService.generateBillForOperation(mockOp);

        expect(bill1.invoice_number).toBe(bill2.invoice_number);
    });

    test('should create manual bills with custom fees', async () => {
        const manualBill = await billingService.createManualBill({
            customer_name: 'Hapag-Lloyd AG',
            docking_fee: 1500,
            crane_usage_fee: 900,
            storage_fee: 400,
        });

        expect(manualBill).toBeDefined();
        expect(manualBill.customer_name).toBe('Hapag-Lloyd AG');
        expect(manualBill.total_amount).toBe(2800);
        expect(manualBill.payment_status).toBe('Pending');
    });

    test('should mark a pending bill as Paid', async () => {
        const manualBill = await billingService.createManualBill({
            customer_name: 'CMA CGM',
            docking_fee: 1000,
            crane_usage_fee: 500,
            storage_fee: 200,
        });

        const paidBill = await billingService.payBill(manualBill.id);
        expect(paidBill.payment_status).toBe('Paid');
        expect(paidBill.paid_at).toBeDefined();
    });
});

