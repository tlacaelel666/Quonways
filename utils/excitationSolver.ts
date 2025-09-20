import ode from 'ode-rk4';
import type { ExcitationDataPoint, ExcitationResult } from '../types';

// Simple Complex number class
class Complex {
  re: number;
  im: number;

  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  mul(other: Complex): Complex {
    const re = this.re * other.re - this.im * other.im;
    const im = this.re * other.im + this.im * other.re;
    return new Complex(re, im);
  }

  mulScalar(scalar: number): Complex {
    return new Complex(this.re * scalar, this.im * scalar);
  }

  abs(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
}

type ComplexVector = Complex[];
type ComplexMatrix = Complex[][];

// Matrix-vector multiplication
function matVecMul(matrix: ComplexMatrix, vector: ComplexVector): ComplexVector {
  return matrix.map(row =>
    row.reduce((acc, val, j) => acc.add(val.mul(vector[j])), new Complex(0, 0))
  );
}

// The right-hand side of the Schrödinger equation: dΨ/dt = -i * H * Ψ
function excitationEquationRHS(
  psiVector: number[],
  t: number,
  H0_matrix: ComplexMatrix,
  V_tensor: ComplexMatrix,
  hassimDeltaFunc: (t: number) => number
): number[] {
  // Convert flat number array from solver back to ComplexVector
  const psi: ComplexVector = [];
  for (let i = 0; i < psiVector.length; i += 2) {
    psi.push(new Complex(psiVector[i], psiVector[i + 1]));
  }

  const delta_h = hassimDeltaFunc(t);

  // Linear term: H_eff = H0_matrix * t * delta_h
  const linear_operator = H0_matrix.map(row => row.map(c => c.mulScalar(t * delta_h)));
  const linear_term = matVecMul(linear_operator, psi);

  // Nonlinear term: (V_tensor @ psi_vector) * psi_vector
  const v_psi = matVecMul(V_tensor, psi);
  const nonlinear_term = v_psi.map((val, i) => val.mul(psi[i]));

  // Sum terms
  const h_psi = linear_term.map((val, i) => val.add(nonlinear_term[i]));

  // d_psi_dt = -i * h_psi
  // -i * (a + bi) = b - ai
  const d_psi_dt_complex = h_psi.map(c => new Complex(c.im, -c.re));

  // Flatten back to number array for the solver
  const d_psi_dt_flat: number[] = [];
  d_psi_dt_complex.forEach(c => {
    d_psi_dt_flat.push(c.re, c.im);
  });
  
  return d_psi_dt_flat;
}

// Simple square pulse for Hassim delta function
function simpleHassimDelta(t: number, activation_time: number, duration: number): number {
  return (activation_time <= t && t <= activation_time + duration) ? 1.0 : 0.0;
}

// Main simulation function
export function simulateExcitationDynamics(): ExcitationResult {
  // --- Simulation Parameters ---
  const initial_psi_complex = [new Complex(1, 0), new Complex(0, 0)];
  const H0_example: ComplexMatrix = [
    [new Complex(0.1, 0), new Complex(0.5, 0)],
    [new Complex(0.5, 0), new Complex(-0.1, 0)],
  ];
  const V_example: ComplexMatrix = [
    [new Complex(0, 0), new Complex(0.02, 0)],
    [new Complex(0.02, 0), new Complex(0, 0)],
  ];
  const t_span = { start: 0, end: 20 };
  const dt = 0.1;
  const hassim_params = { activation_time: 5.0, duration: 2.0 };

  const hassim_func = (t: number) => simpleHassimDelta(t, hassim_params.activation_time, hassim_params.duration);

  // Flatten initial state for the solver: [re0, im0, re1, im1, ...]
  const initial_psi_flat = initial_psi_complex.flatMap(c => [c.re, c.im]);

  const solver = ode(
    initial_psi_flat,
    (dydt, y, t) => {
        const result = excitationEquationRHS(y, t, H0_example, V_example, hassim_func);
        for(let i=0; i<result.length; ++i) {
            dydt[i] = result[i];
        }
    },
    t_span.start,
    dt
  );

  const results: ExcitationDataPoint[] = [];

  for (let t = t_span.start; t <= t_span.end; t += dt) {
    solver.step();
    const psi_flat = solver.y;
    const psi_complex = [new Complex(psi_flat[0], psi_flat[1]), new Complex(psi_flat[2], psi_flat[3])];
    
    // Normalize the state
    const norm = Math.sqrt(psi_complex.reduce((sum, c) => sum + c.abs() * c.abs(), 0));
    if (norm > 1e-9) {
        psi_complex.forEach(c => {
            c.re /= norm;
            c.im /= norm;
        });
    }

    results.push({
      t: solver.t,
      psi0: psi_complex[0].abs(),
      psi1: psi_complex[1].abs(),
    });
  }

  return { success: true, data: results };
}