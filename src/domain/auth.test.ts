import { classifyAuthError, isValidEmail, isValidPassword, normalizeEmail } from './auth';

describe('validación de cuenta (CUE-01)', () => {
  it('acepta correos con formato válido', () => {
    expect(isValidEmail('ana@correo.com')).toBe(true);
    expect(isValidEmail('  ana.lopez+gym@uabc.edu.mx ')).toBe(true);
  });

  it('rechaza correos mal escritos', () => {
    for (const bad of ['', 'ana', 'ana@', 'ana@correo', 'ana correo@x.com', '@correo.com', 'ana@correo.c']) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });

  it('pide al menos 8 caracteres de contraseña', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
  });

  it('normaliza el correo', () => {
    expect(normalizeEmail('  Ana@Correo.COM ')).toBe('ana@correo.com');
  });
});

describe('classifyAuthError', () => {
  it('reconoce los códigos de Supabase', () => {
    expect(classifyAuthError({ code: 'user_already_exists' })).toBe('email_taken');
    expect(classifyAuthError({ code: 'invalid_credentials' })).toBe('invalid_credentials');
    expect(classifyAuthError({ code: 'weak_password' })).toBe('weak_password');
    expect(classifyAuthError({ code: 'email_address_invalid' })).toBe('invalid_email');
    expect(classifyAuthError({ code: 'email_not_confirmed' })).toBe('email_not_confirmed');
    expect(classifyAuthError({ code: 'over_email_send_rate_limit' })).toBe('rate_limit');
  });

  it('reconoce la falta de conexión', () => {
    expect(classifyAuthError({ name: 'AuthRetryableFetchError', message: 'x' })).toBe('network');
    expect(classifyAuthError(new TypeError('Network request failed'))).toBe('network');
  });

  it('usa el mensaje cuando no hay código', () => {
    expect(classifyAuthError({ message: 'User already registered' })).toBe('email_taken');
    expect(classifyAuthError({ message: 'Invalid login credentials' })).toBe('invalid_credentials');
  });

  it('lo demás es desconocido', () => {
    expect(classifyAuthError(null)).toBe('unknown');
    expect(classifyAuthError('texto')).toBe('unknown');
    expect(classifyAuthError({ code: 'otra_cosa' })).toBe('unknown');
  });
});
