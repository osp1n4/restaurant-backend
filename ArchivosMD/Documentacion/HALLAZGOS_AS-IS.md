# Hallazgos As Is

1. **Notificaciones**
   - No se detalla el formato exacto de las notificaciones enviadas por SSE ni cómo el frontend debe manejarlas.

2. **Errores y validaciones**
   - No se especifica cómo se manejan los errores en los endpoints ni qué validaciones se aplican a los datos de entrada.

3. **Variables de entorno**
   - No hay un archivo de ejemplo ni una lista clara de variables de entorno necesarias para cada servicio.

4. **Pruebas automáticas**
   - Se menciona testing, pero no se especifica el alcance, cobertura ni cómo deben estructurarse los tests.

5. **Dependencias entre servicios**
   - No queda claro qué ocurre si un servicio (por ejemplo, Notification Service) no está disponible o falla RabbitMQ.

7. **Consistencia de datos**
   - No se explica cómo se asegura la consistencia entre los estados de los pedidos en los diferentes servicios y bases de datos.

8. **Escalabilidad**
   - No se menciona cómo escalar los servicios ni si hay limitaciones conocidas.

9. **Cancelaciones de pedidos**
    - No se detalla el proceso para cancelar un pedido una vez que ha sido creado.

10. **Autenticación y autorización**
      - No se especifica si hay algún mecanismo de autenticación o autorización para acceder a los endpoints de los servicios.