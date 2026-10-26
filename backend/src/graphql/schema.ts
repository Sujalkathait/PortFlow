// =============================================================================
// PortFlow GraphQL Schema Definition (TypeDefs)
// Architecture: Relational Graph Schema matching 3NF Database & OS Simulator
// =============================================================================

export const typeDefs = `#graphql
    """
    User Account representing Terminal Operators, Inspectors, or Administrators
    """
    type User {
        id: Int!
        email: String!
        fullName: String!
        role: String!
        createdAt: String!
        operations: [Operation!]
        reportedIssues: [Issue!]
        inspections: [CustomsInspection!]
        systemLogs: [SystemLog!]
    }

    """
    Physical Shared Port Resources (Berths, STS Quay Cranes, Yard Gantries)
    Managed via Mutex locks and Counting Semaphores in OS kernel.
    """
    type Equipment {
        id: Int!
        equipmentId: String!
        name: String!
        type: String!
        status: String!
        capacityMetric: Float
        assignedTo: String
        createdAt: String!
        berthedShips: [Ship!]
        craneOperations: [Operation!]
        berthOperations: [Operation!]
        reportedIssues: [Issue!]
    }

    """
    Marine Vessels calling at Port terminal.
    """
    type Ship {
        id: Int!
        imoNumber: String!
        name: String!
        vesselType: String!
        capacityTeu: Int!
        status: String!
        berthId: String
        eta: String
        etd: String
        createdAt: String!
        assignedBerth: Equipment
        cargoManifests: [Cargo!]
        operations: [Operation!]
        bills: [Bill!]
    }

    """
    Container Freight Stations (CFS) and Temperature-Controlled Reefer Zones
    """
    type Warehouse {
        id: Int!
        code: String!
        name: String!
        zoneType: String!
        capacityTeu: Int!
        currentOccupancyTeu: Int!
        temperatureCelsius: Float
        status: String!
        storedCargo: [Cargo!]
    }

    """
    Shipping Containers & Freight Manifests
    """
    type Cargo {
        id: Int!
        cargoNumber: String!
        sizeType: String!
        weightTons: Float!
        cargoType: String!
        currentLocation: String!
        shipName: String!
        status: String!
        hazardClass: String
        createdAt: String!
        vessel: Ship
        warehouse: Warehouse
        operations: [Operation!]
        inspections: [CustomsInspection!]
        transportTrucks: [Truck!]
        gatePasses: [GatePass!]
        bills: [Bill!]
    }

    """
    Process Control Block (PCB) scheduled via FCFS, SJF, or Priority CPU algorithms
    """
    type Operation {
        id: Int!
        processId: String
        operationType: String!
        shipName: String!
        craneId: String
        berthId: String
        priority: Int!
        status: String!
        startTime: String
        endTime: String
        waitingTimeMs: Int
        turnaroundTimeMs: Int
        createdAt: String!
        vessel: Ship
        container: Cargo
        assignedCrane: Equipment
        assignedBerth: Equipment
        initiator: User
        bills: [Bill!]
    }

    """
    Land Drayage Logistics & Gate Truck Fleet
    """
    type Truck {
        id: Int!
        licensePlate: String!
        driverName: String!
        driverPhone: String!
        transportCompany: String!
        status: String!
        maxPayloadTons: Float!
        currentCargo: Cargo
        gatePasses: [GatePass!]
    }

    """
    Terminal Gate Access Control & Security Interchange
    """
    type GatePass {
        id: Int!
        passNumber: String!
        gateLane: String!
        passType: String!
        status: String!
        checkInTime: String
        checkOutTime: String
        truck: Truck!
        container: Cargo
        issuer: User
    }

    """
    Customs Border Regulatory Inspections, Holds, and Duty Tariffs
    """
    type CustomsInspection {
        id: Int!
        inspectionNumber: String!
        declarationNumber: String!
        inspectionType: String!
        status: String!
        dutyAmountCents: String!
        findings: String
        inspectedAt: String
        clearedAt: String
        container: Cargo!
        inspector: User
    }

    """
    Tariff Billing & Invoicing Engine
    """
    type Bill {
        id: Int!
        invoiceNumber: String!
        customerName: String!
        dockingFee: Float!
        craneUsageFee: Float!
        storageFee: Float!
        totalAmount: Float!
        currency: String!
        paymentStatus: String!
        dueDate: String
        paidAt: String
        vessel: Ship
        container: Cargo
        operation: Operation
    }

    """
    Incident Report & Hardware Breakdown Tickets
    """
    type Issue {
        id: Int!
        ticketNumber: String!
        title: String!
        description: String!
        severity: String!
        status: String!
        resolutionNotes: String
        resolvedAt: String
        createdAt: String!
        reporter: User
        faultyEquipment: Equipment
    }

    """
    System Runtime Observability & User Audit Trail
    """
    type SystemLog {
        id: Int!
        timestamp: String!
        level: String!
        source: String!
        message: String!
        action: String
        entityType: String
        entityId: Int
        operator: User
    }

    """
    Aggregated High-Level Dashboard Statistics
    """
    type TableCounts {
        users: Int!
        operations: Int!
        ships: Int!
        cargo: Int!
        equipment: Int!
        warehouses: Int!
        trucks: Int!
        bills: Int!
        issues: Int!
    }

    type PortDashboardOverview {
        tableStats: TableCounts!
        activeOperationsCount: Int!
        dockedShipsCount: Int!
        resourceAvailabilityPercent: String!
        dbStatus: String!
        recentLogs: [SystemLog!]!
    }

    # =========================================================================
    # Queries
    # =========================================================================
    type Query {
        """
        Consolidated real-time operational dashboard overview
        """
        portDashboardOverview: PortDashboardOverview!

        """
        Retrieve all calling marine vessels (optionally filtered by status)
        """
        ships(status: String): [Ship!]!

        """
        Retrieve a single vessel by ID or IMO registration number
        """
        ship(id: Int, imoNumber: String): Ship

        """
        Retrieve container manifests (optionally filtered by status or shipId)
        """
        cargo(status: String, shipId: Int): [Cargo!]!

        """
        Retrieve a single container by ID or container prefix number
        """
        container(id: Int, cargoNumber: String): Cargo

        """
        Retrieve port equipment (Berths, Quay Cranes, Yard Gantries)
        """
        equipment(type: String, status: String): [Equipment!]!

        """
        Retrieve scheduled and active port operations
        """
        operations(status: String, priority: Int): [Operation!]!

        """
        Retrieve single operation by ID or OS Process ID
        """
        operation(id: Int, processId: String): Operation

        """
        Retrieve Container Freight Stations & Cold Storage Warehouses
        """
        warehouses(zoneType: String): [Warehouse!]!

        """
        Retrieve drayage trucks fleet
        """
        trucks(status: String): [Truck!]!

        """
        Retrieve regulatory customs inspections
        """
        customsInspections(status: String): [CustomsInspection!]!

        """
        Retrieve tariff bills & invoices
        """
        bills(paymentStatus: String): [Bill!]!

        """
        Retrieve incident and maintenance support tickets
        """
        issues(status: String, severity: String): [Issue!]!

        """
        Retrieve recent system events and user audit mutation logs
        """
        systemLogs(level: String, limit: Int): [SystemLog!]!
    }

    # =========================================================================
    # Mutations
    # =========================================================================
    type Mutation {
        """
        Schedule a new port operation (Discharge/Load) into the OS ready queue
        """
        createOperation(
            shipName: String!
            operationType: String!
            priority: Int
            craneId: String
            berthId: String
        ): Operation!

        """
        Submit an equipment breakdown or operational incident ticket
        """
        reportIssue(
            title: String!
            description: String!
            severity: String
            equipmentId: Int
        ): Issue!

        """
        Update physical equipment operational status (Available / Maintenance / In Use)
        """
        updateEquipmentStatus(
            id: Int!
            status: String!
        ): Equipment!

        """
        Trigger OS scheduler to dispatch next highest priority process
        """
        dispatchOperation: Operation
    }
`;
