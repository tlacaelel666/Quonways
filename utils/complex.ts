// A simple complex number class to handle quantum amplitudes.
export class Complex {
    re: number;
    im: number;

    constructor(re = 0, im = 0) {
        this.re = re;
        this.im = im;
    }
    
    static I = new Complex(0, 1);

    static fromPolar(r: number, theta: number): Complex {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
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

    angle(): number {
        return Math.atan2(this.im, this.re);
    }

    copy(): Complex {
        return new Complex(this.re, this.im);
    }
}