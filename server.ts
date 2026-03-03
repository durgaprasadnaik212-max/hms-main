import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = "super-secret-key-change-in-production";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Database Seeding
async function seedDb() {
  const tenantCount = await prisma.tenant.count();
  if (tenantCount === 0) {
    console.log("Seeding database...");
    
    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: "General Hospital",
        primaryColor: "#0f172a",
      }
    });

    const tenantId = tenant.id;
    const hashedPassword = bcrypt.hashSync("password123", 10);

    // Create Users
    const admin = await prisma.user.create({
      data: {
        tenantId,
        name: "Sarah Connor",
        email: "admin@hospital.com",
        password: hashedPassword,
        role: "admin",
        avatar: "https://i.pravatar.cc/150?u=admin"
      }
    });

    await prisma.user.create({
      data: {
        tenantId,
        name: "Super Admin",
        email: "superadmin@gmail.com",
        password: hashedPassword,
        role: "superadmin",
        avatar: "https://i.pravatar.cc/150?u=superadmin"
      }
    });

    const doctor = await prisma.user.create({
      data: {
        tenantId,
        name: "Dr. Gregory House",
        email: "house@hospital.com",
        password: hashedPassword,
        role: "doctor",
        specialty: "Diagnostician",
        avatar: "https://i.pravatar.cc/150?u=doctor"
      }
    });

    const patient = await prisma.user.create({
      data: {
        tenantId,
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        role: "patient",
        avatar: "https://i.pravatar.cc/150?u=patient"
      }
    });

    // Create Beds (2 floors, 10 beds each)
    for (let f = 1; f <= 2; f++) {
      for (let r = 1; r <= 10; r++) {
        const status = Math.random() > 0.7 ? "occupied" : (Math.random() > 0.9 ? "cleaning" : "available");
        await prisma.bed.create({
          data: {
            tenantId,
            floor: f,
            room: `Room ${f}0${r}`,
            status
          }
        });
      }
    }

    // Create Appointments
    const today = new Date();
    
    await prisma.appointment.createMany({
      data: [
        {
          tenantId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date(today.setHours(9, 0)),
          status: "completed",
          reason: "Regular Checkup"
        },
        {
          tenantId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date(today.setHours(10, 30)),
          status: "waiting",
          reason: "Migraine"
        },
        {
          tenantId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date(today.setHours(14, 0)),
          status: "scheduled",
          reason: "Follow up"
        }
      ]
    });
  }
}

seedDb();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const totalPatients = await prisma.user.count({ where: { role: 'patient' } });
      const availableBeds = await prisma.bed.count({ where: { status: 'available' } });
      const doctorsOnDuty = await prisma.user.count({ where: { role: 'doctor' } });
      
      // Calculate revenue based on completed appointments, lab bookings, and radiology bookings today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedAppointments = await prisma.appointment.count({
        where: {
          status: 'completed',
          startTime: { gte: today }
        }
      });
      
      const completedLabs = await prisma.labBooking.count({
        where: {
          status: 'completed',
          updatedAt: { gte: today }
        }
      });
      
      const completedRadiology = await prisma.radiologyBooking.count({
        where: {
          status: 'completed',
          updatedAt: { gte: today }
        }
      });

      // Calculate revenue from paid invoices today
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          status: 'paid',
          updatedAt: { gte: today }
        }
      });
      
      const revenueToday = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

      res.json({
        totalPatients,
        availableBeds,
        doctorsOnDuty,
        revenueToday
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tenant Routes
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          _count: {
            select: { users: true }
          },
          users: {
            where: { role: 'admin' },
            select: { email: true }
          }
        }
      });
      
      const formatted = tenants.map(t => ({
        id: t.id,
        name: t.name,
        url: t.url,
        logo: t.logo,
        primaryColor: t.primaryColor,
        userCount: t._count.users,
        status: 'active', // For now, we don't have a status field in DB, defaulting to active
        adminEmail: t.users.length > 0 ? t.users[0].email : ''
      }));
      
      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    const { name, url, logo, primaryColor, adminEmail, adminPassword } = req.body;
    
    try {
      // Use a transaction to ensure both tenant and admin are created, or neither
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            name,
            url,
            logo,
            primaryColor
          }
        });

        // 2. Create Admin User for this Tenant
        if (adminEmail && adminPassword) {
          const hashedPassword = bcrypt.hashSync(adminPassword, 10);
          await tx.user.create({
            data: {
              tenantId: tenant.id,
              name: "Hospital Admin",
              email: adminEmail,
              password: hashedPassword,
              role: "admin",
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            }
          });
        }

        return tenant;
      });

      res.json(result);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'P2002') {
        return res.status(400).json({ error: "Email or Tenant details already exist" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    const { id } = req.params;
    const { name, url, logo, primaryColor, adminEmail, adminPassword } = req.body;
    try {
      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.update({
          where: { id },
          data: { name, url, logo, primaryColor }
        });

        if (adminEmail) {
          // Find existing admin
          const existingAdmin = await tx.user.findFirst({
            where: { tenantId: id, role: 'admin' }
          });

          if (existingAdmin) {
            const updateData: any = { email: adminEmail };
            if (adminPassword) {
              updateData.password = bcrypt.hashSync(adminPassword, 10);
            }
            await tx.user.update({
              where: { id: existingAdmin.id },
              data: updateData
            });
          } else if (adminPassword) {
             // Create admin if doesn't exist
             await tx.user.create({
               data: {
                 tenantId: id,
                 name: "Hospital Admin",
                 email: adminEmail,
                 password: bcrypt.hashSync(adminPassword, 10),
                 role: "admin",
                 avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
               }
             });
          }
        }
        return tenant;
      });
      res.json(result);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'P2002') {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // First delete related records to avoid foreign key constraints
      // In a real app, you might want to soft delete or archive
      await prisma.appointment.deleteMany({ where: { tenantId: id } });
      await prisma.bed.deleteMany({ where: { tenantId: id } });
      await prisma.user.deleteMany({ where: { tenantId: id } });
      
      await prisma.tenant.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Auth Routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    
    if (!['admin', 'doctor', 'patient'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      // For demo, we assume the first tenant exists. In a real multi-tenant app, 
      // you'd select the tenant based on the domain or invitation.
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          password: hashedPassword,
          role
        }
      });
      
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      if (error.code === 'P2002') { // Prisma unique constraint violation
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users", async (req, res) => {
    const { role } = req.query;
    try {
      const users = await prisma.user.findMany({
        where: role ? { role: role as string } : {},
        select: { id: true, name: true, email: true, role: true, specialty: true, avatar: true }
      });
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, role, specialty, password } = req.body;
      console.log(`[POST] /api/users - Creating user: ${email}, role: ${role}`);

      const tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        console.error("[POST] No tenant found");
        return res.status(500).json({ error: "System configuration error: No tenant found" });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        console.warn(`[POST] User already exists: ${email}`);
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password || "password123", 10);

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          role,
          specialty,
          password: hashedPassword
        }
      });
      console.log(`[POST] User created: ${user.id}`);
      res.json(user);
    } catch (err) {
      console.error("[POST] Error creating user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, avatar, password, role, specialty } = req.body;
    
    try {
      const updateData: any = { name, email, avatar, role, specialty };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'P2002') {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[DELETE] /api/users/${id}`);
    try {
      await prisma.$transaction(async (tx) => {
        // Delete related records
        await tx.appointment.deleteMany({ where: { patientId: id } });
        await tx.appointment.deleteMany({ where: { doctorId: id } });
        await tx.labBooking.deleteMany({ where: { patientId: id } });
        await tx.radiologyBooking.deleteMany({ where: { patientId: id } });
        
        // Delete invoices and release beds
        await tx.invoice.deleteMany({ where: { patientId: id } });
        await tx.bed.updateMany({
          where: { patientId: id },
          data: { status: 'available', patientId: null }
        });

        await tx.user.delete({ where: { id } });
      });
      
      console.log(`[DELETE] User ${id} deleted successfully`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[DELETE] Error deleting user ${id}:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/beds", async (req, res) => {
    try {
      const beds = await prisma.bed.findMany({
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      res.json(beds);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/beds", async (req, res) => {
    const { floor, room, status, patientId } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");
      const bed = await prisma.bed.create({
        data: { tenantId: tenant.id, floor: Number(floor), room, status, patientId: patientId || null },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      io.emit('bed-created', bed);
      res.json(bed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/beds/:id", async (req, res) => {
    const { id } = req.params;
    const { floor, room, status, patientId } = req.body;
    try {
      const bed = await prisma.bed.update({
        where: { id },
        data: { floor: Number(floor), room, status, patientId: patientId || null },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      io.emit('bed-updated', bed);
      res.json(bed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/beds/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.bed.deleteMany({ where: { id } });
      io.emit('bed-deleted', id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/lab-bookings", async (req, res) => {
    try {
      const bookings = await prisma.labBooking.findMany({
        include: { patient: { select: { id: true, name: true } } }
      });
      res.json(bookings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/lab-bookings", async (req, res) => {
    const { patientId, test, status } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");
      const booking = await prisma.labBooking.create({
        data: { 
          tenantId: tenant.id, 
          patientId, 
          test,
          status: status || 'pending'
        }
      });
      res.json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/lab-bookings/:id", async (req, res) => {
    const { id } = req.params;
    const { test, status } = req.body;
    try {
      const booking = await prisma.labBooking.update({
        where: { id },
        data: { test, status }
      });
      res.json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/lab-bookings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.labBooking.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/radiology-bookings", async (req, res) => {
    try {
      const bookings = await prisma.radiologyBooking.findMany({
        include: { patient: { select: { id: true, name: true } } }
      });
      res.json(bookings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/radiology-bookings", async (req, res) => {
    const { patientId, test, status } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");
      const booking = await prisma.radiologyBooking.create({
        data: { 
          tenantId: tenant.id, 
          patientId, 
          test,
          status: status || 'pending'
        }
      });
      res.json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/radiology-bookings/:id", async (req, res) => {
    const { id } = req.params;
    const { test, status } = req.body;
    try {
      const booking = await prisma.radiologyBooking.update({
        where: { id },
        data: { test, status }
      });
      res.json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/radiology-bookings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.radiologyBooking.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Medicine Routes
  app.get("/api/medicines", async (req, res) => {
    try {
      const medicines = await prisma.medicine.findMany({ include: { supplier: true } });
      res.json(medicines);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/medicines", async (req, res) => {
    const { name, stock, expiryDate, supplierId } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");
      const medicine = await prisma.medicine.create({
        data: { tenantId: tenant.id, name, stock, expiryDate: new Date(expiryDate), supplierId }
      });
      res.json(medicine);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/medicines/:id", async (req, res) => {
    const { id } = req.params;
    const { name, stock, expiryDate, supplierId } = req.body;
    try {
      const medicine = await prisma.medicine.update({
        where: { id },
        data: { name, stock, expiryDate: new Date(expiryDate), supplierId }
      });
      res.json(medicine);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.medicine.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Supplier Routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await prisma.supplier.findMany();
      res.json(suppliers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    const { name, contact } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");
      const supplier = await prisma.supplier.create({
        data: { tenantId: tenant.id, name, contact }
      });
      res.json(supplier);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, contact } = req.body;
    try {
      const supplier = await prisma.supplier.update({
        where: { id },
        data: { name, contact }
      });
      res.json(supplier);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.medicine.deleteMany({ where: { supplierId: id } });
      await prisma.supplier.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } }
        }
      });
      
      // Flatten structure to match frontend expectation
      const formatted = appointments.map(a => ({
        ...a,
        patient_name: a.patient.name,
        doctor_name: a.doctor.name
      }));
      
      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const { patientId, doctorId, startTime, reason } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          patientId,
          doctorId,
          startTime: new Date(startTime),
          status: 'scheduled',
          reason
        }
      });
      res.json(appointment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    const { patientId, doctorId, startTime, reason, status } = req.body;
    try {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          patientId,
          doctorId,
          startTime: startTime ? new Date(startTime) : undefined,
          reason,
          status
        }
      });
      res.json(appointment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.appointment.deleteMany({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/emergency", (req, res) => {
    const { type, location } = req.body;
    io.emit("emergency-alert", { type, location, timestamp: new Date() });
    res.json({ success: true });
  });

  // Invoices API
  app.get("/api/invoices", async (req, res) => {
    const { patientId } = req.query;
    try {
      const invoices = await prisma.invoice.findMany({
        where: patientId ? { patientId: String(patientId) } : {},
        include: {
          patient: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(invoices);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    const { patientId, items, status } = req.body;
    try {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) throw new Error("No tenant found");

      const amount = items.reduce((sum: number, item: any) => sum + Number(item.cost), 0);

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          patientId,
          items,
          amount,
          status: status || 'pending'
        }
      });
      io.emit('invoice-created', invoice);
      res.json(invoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const invoice = await prisma.invoice.update({
        where: { id },
        data: { status }
      });
      io.emit('invoice-updated', invoice);
      res.json(invoice);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Socket.io
  io.on("connection", (socket) => {
    console.log("Client connected");
    
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if we were building)
    app.use(express.static(path.join(__dirname, "dist")));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
