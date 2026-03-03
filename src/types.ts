export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'superadmin' | 'staff' | 'receptionist' | 'nurse' | 'lab_tech' | 'pharmacist' | 'accountant' | 'radiologist';
  specialty?: string;
  avatar?: string;
}

export interface Bed {
  id: string;
  tenantId: string;
  floor: number;
  room: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  patientId?: string;
  patient?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'waiting';
  reason: string;
  patient_name?: string;
  doctor_name?: string;
}
