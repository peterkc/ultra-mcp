import { runDoctorWithDeps } from './doctor-injectable';

interface DoctorOptions {
  test?: boolean;
}

export async function runDoctor(options: DoctorOptions = {}): Promise<void> {
  return runDoctorWithDeps(options);
}

// Re-export for testing
export { runDoctorWithDeps };