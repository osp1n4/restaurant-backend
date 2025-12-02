import { Validators } from '../utils/validators';

describe('Validators - Principios FIRST', () => {
  // Los tests de validators son naturalmente FIRST porque:
  // - Fast: Son funciones puras sin I/O
  // - Independent: No comparten estado
  // - Repeatable: Mismo input = mismo output
  // - Self-validating: Aserciones claras
  // - Timely: Escritos con el código

  describe('isEmail', () => {
    // Fast: Validación de regex pura, sin dependencias externas
    it('debería validar email estándar correcto', () => {
      expect(Validators.isEmail('test@example.com')).toBe(true);
    });

    it('debería validar email con subdominios', () => {
      expect(Validators.isEmail('user.name@example.co.uk')).toBe(true);
    });

    it('debería validar email con signo plus (alias)', () => {
      expect(Validators.isEmail('user+tag@example.com')).toBe(true);
    });

    it('debería validar email con números', () => {
      expect(Validators.isEmail('user123@test456.com')).toBe(true);
    });

    it('debería validar email con guiones', () => {
      expect(Validators.isEmail('user-name@test-domain.com')).toBe(true);
    });

    // Independent: Cada test es independiente, no afecta a otros
    it('debería rechazar email sin arroba', () => {
      expect(Validators.isEmail('invalid-email')).toBe(false);
    });

    it('debería rechazar email sin parte local', () => {
      expect(Validators.isEmail('@example.com')).toBe(false);
    });

    it('debería rechazar email sin dominio', () => {
      expect(Validators.isEmail('user@')).toBe(false);
    });

    it('debería rechazar email sin TLD', () => {
      expect(Validators.isEmail('user@domain')).toBe(false);
    });

    it('debería rechazar email con dominio inválido', () => {
      expect(Validators.isEmail('user@.com')).toBe(false);
    });

    it('debería rechazar email con espacios', () => {
      expect(Validators.isEmail('user name@example.com')).toBe(false);
    });

    it('debería rechazar email vacío', () => {
      expect(Validators.isEmail('')).toBe(false);
    });

    it('debería rechazar múltiples arrobas', () => {
      expect(Validators.isEmail('user@@example.com')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    // Repeatable: Siempre retorna el mismo resultado para los mismos inputs
    describe('valores que deben ser vacíos', () => {
      it('debería detectar null como vacío', () => {
        expect(Validators.isEmpty(null)).toBe(true);
      });

      it('debería detectar undefined como vacío', () => {
        expect(Validators.isEmpty(undefined)).toBe(true);
      });

      it('debería detectar string vacío', () => {
        expect(Validators.isEmpty('')).toBe(true);
      });

      it('debería detectar string solo con espacios como vacío', () => {
        expect(Validators.isEmpty('   ')).toBe(true);
      });

      it('debería detectar string con tabs y espacios como vacío', () => {
        expect(Validators.isEmpty('  \t  \n  ')).toBe(true);
      });

      it('debería detectar array vacío', () => {
        expect(Validators.isEmpty([])).toBe(true);
      });

      it('debería detectar objeto vacío', () => {
        expect(Validators.isEmpty({})).toBe(true);
      });
    });

    describe('valores que NO deben ser vacíos', () => {
      it('debería detectar string con texto como no vacío', () => {
        expect(Validators.isEmpty('text')).toBe(false);
      });

      it('debería detectar string con un carácter como no vacío', () => {
        expect(Validators.isEmpty('a')).toBe(false);
      });

      it('debería detectar array con elementos como no vacío', () => {
        expect(Validators.isEmpty(['item'])).toBe(false);
      });

      it('debería detectar array con múltiples elementos como no vacío', () => {
        expect(Validators.isEmpty([1, 2, 3])).toBe(false);
      });

      it('debería detectar objeto con propiedades como no vacío', () => {
        expect(Validators.isEmpty({ key: 'value' })).toBe(false);
      });

      it('debería detectar número cero como no vacío', () => {
        expect(Validators.isEmpty(0)).toBe(false);
      });

      it('debería detectar número negativo como no vacío', () => {
        expect(Validators.isEmpty(-1)).toBe(false);
      });

      it('debería detectar false como no vacío', () => {
        expect(Validators.isEmpty(false)).toBe(false);
      });

      it('debería detectar true como no vacío', () => {
        expect(Validators.isEmpty(true)).toBe(false);
      });
    });
  });

  describe('validateEmail', () => {
    // Self-validating: Las aserciones son claras y específicas
    describe('casos exitosos', () => {
      it('debería validar email simple correctamente', () => {
        const result = Validators.validateEmail('test@example.com');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it('debería validar email corporativo', () => {
        const result = Validators.validateEmail('usuario@empresa.com.ar');
        expect(result.valid).toBe(true);
      });

      it('debería validar email con alias', () => {
        const result = Validators.validateEmail('user+newsletter@example.com');
        expect(result.valid).toBe(true);
      });
    });

    describe('casos de error - email vacío', () => {
      it('debería rechazar string vacío', () => {
        const result = Validators.validateEmail('');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El email es requerido');
      });

      it('debería rechazar string con solo espacios', () => {
        const result = Validators.validateEmail('   ');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El email es requerido');
      });
    });

    describe('casos de error - formato inválido', () => {
      it('debería rechazar email sin arroba', () => {
        const result = Validators.validateEmail('invalid-email');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El formato del email no es válido');
      });

      it('debería rechazar email sin dominio', () => {
        const result = Validators.validateEmail('user@');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El formato del email no es válido');
      });

      it('debería rechazar email sin parte local', () => {
        const result = Validators.validateEmail('@example.com');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El formato del email no es válido');
      });

      it('debería rechazar email con espacios', () => {
        const result = Validators.validateEmail('user name@example.com');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('El formato del email no es válido');
      });
    });
  });

  describe('validateRequired', () => {
    describe('casos exitosos', () => {
      it('debería validar string con contenido', () => {
        const result = Validators.validateRequired('value', 'fieldName');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it('debería validar número cero', () => {
        const result = Validators.validateRequired(0, 'edad');
        expect(result.valid).toBe(true);
      });

      it('debería validar boolean false', () => {
        const result = Validators.validateRequired(false, 'activo');
        expect(result.valid).toBe(true);
      });

      it('debería validar array con elementos', () => {
        const result = Validators.validateRequired([1, 2], 'items');
        expect(result.valid).toBe(true);
      });

      it('debería validar objeto con propiedades', () => {
        const result = Validators.validateRequired({ key: 'value' }, 'config');
        expect(result.valid).toBe(true);
      });
    });

    describe('casos de error', () => {
      it('debería rechazar string vacío con nombre de campo correcto', () => {
        const result = Validators.validateRequired('', 'nombre');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('nombre es requerido');
      });

      it('debería rechazar null', () => {
        const result = Validators.validateRequired(null, 'campo');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('campo es requerido');
      });

      it('debería rechazar undefined', () => {
        const result = Validators.validateRequired(undefined, 'campo');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('campo es requerido');
      });

      it('debería rechazar array vacío', () => {
        const result = Validators.validateRequired([], 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items es requerido');
      });

      it('debería rechazar objeto vacío', () => {
        const result = Validators.validateRequired({}, 'config');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('config es requerido');
      });

      it('debería incluir nombre de campo en diferentes idiomas', () => {
        const result = Validators.validateRequired('', 'customerEmail');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('customerEmail es requerido');
      });
    });
  });

  describe('validateArray', () => {
    describe('casos exitosos', () => {
      it('debería validar array con un elemento (mínimo por defecto)', () => {
        const result = Validators.validateArray([1], 'items');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it('debería validar array con múltiples elementos', () => {
        const result = Validators.validateArray([1, 2, 3], 'items', 1);
        expect(result.valid).toBe(true);
      });

      it('debería validar array que cumple exactamente el mínimo', () => {
        const result = Validators.validateArray([1, 2], 'items', 2);
        expect(result.valid).toBe(true);
      });

      it('debería validar array que supera el mínimo', () => {
        const result = Validators.validateArray([1, 2, 3, 4, 5], 'items', 3);
        expect(result.valid).toBe(true);
      });

      it('debería validar array con mínimo cero', () => {
        const result = Validators.validateArray([], 'items', 0);
        expect(result.valid).toBe(true);
      });

      it('debería validar array con diferentes tipos de datos', () => {
        const result = Validators.validateArray(['a', 1, true, {}], 'mixed', 1);
        expect(result.valid).toBe(true);
      });
    });

    describe('casos de error - tipo inválido', () => {
      it('debería rechazar string', () => {
        const result = Validators.validateArray('not-array', 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe ser un array');
      });

      it('debería rechazar número', () => {
        const result = Validators.validateArray(123, 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe ser un array');
      });

      it('debería rechazar objeto', () => {
        const result = Validators.validateArray({ key: 'value' }, 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe ser un array');
      });

      it('debería rechazar null', () => {
        const result = Validators.validateArray(null, 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe ser un array');
      });

      it('debería rechazar undefined', () => {
        const result = Validators.validateArray(undefined, 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe ser un array');
      });
    });

    describe('casos de error - longitud insuficiente', () => {
      it('debería rechazar array vacío con mínimo 1 (por defecto)', () => {
        const result = Validators.validateArray([], 'items');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe contener al menos 1 elemento(s)');
      });

      it('debería rechazar array con menos elementos que el mínimo', () => {
        const result = Validators.validateArray([1], 'items', 2);
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe contener al menos 2 elemento(s)');
      });

      it('debería rechazar array vacío con mínimo específico', () => {
        const result = Validators.validateArray([], 'orderItems', 1);
        expect(result.valid).toBe(false);
        expect(result.message).toBe('orderItems debe contener al menos 1 elemento(s)');
      });

      it('debería mostrar correctamente el mínimo requerido en el mensaje', () => {
        const result = Validators.validateArray([1, 2], 'items', 5);
        expect(result.valid).toBe(false);
        expect(result.message).toBe('items debe contener al menos 5 elemento(s)');
      });
    });
  });
});

