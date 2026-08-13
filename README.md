# TuCitas Auth

Aplicación HTML estática para registrar usuarios, verificar su correo mediante OTP, iniciar sesión y gestionar citas.

## Flujo de registro y verificación

1. `registro.html` envía el registro a `POST /api/auth/register`.
2. Si el registro es exitoso, guarda temporalmente el correo en `sessionStorage` y abre `verificar-otp.html`.
3. La pantalla OTP muestra ese correo como un campo de solo lectura.
4. El formulario envía `POST /api/auth/verify-otp` con `{email, otp}`.
5. Si la verificación es exitosa, elimina el correo temporal y redirige al inicio de sesión.

## API

La URL base predeterminada es `http://localhost:8080`. Se puede cambiar mediante la configuración de servicio de la aplicación, que guarda `tucitas.apiRoot` en `localStorage`.

- Registro: `POST /api/auth/register` con `{nombres,apellidos,email,password}`.
- Verificación: `POST /api/auth/verify-otp` con `{email,otp}`.
- Login: `POST /api/auth/login` con `{email,password}`.

El login debe exponer el token en `data.token`, `token`, `data.accessToken` o `accessToken`. El token y los datos básicos de sesión se guardan únicamente en `sessionStorage`.
