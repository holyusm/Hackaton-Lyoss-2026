# Íconos

Una sola familia: **Phosphor Icons** (`@phosphor-icons/react`), siempre con `weight="bold"`. En las referencias los íconos están dibujados a mano solo como guía de forma y posición: en código se usan estos.

```jsx
import { Wheelchair } from '@phosphor-icons/react';
<Wheelchair size={24} weight="bold" aria-hidden="true" />
```

Tamaños: 24 px por defecto, 20 px dentro de chips y errores, 26 px en avisos y perfiles, 30 px en el tramo de los pasos. Un ícono suelto lleva `aria-label` (o va dentro de un botón con `aria-label`). Si va junto a texto visible, lleva `aria-hidden="true"`.

| Dónde | Phosphor |
|---|---|
| Perfil Estándar | `Person` |
| Perfil Silla de ruedas | `Wheelchair` |
| Perfil Movilidad reducida | `PersonSimpleWalk` |
| Perfil Baja visión | `Eye` |
| Elegido | `Check` |
| Campo Desde | `MapPin` |
| Campo Hasta, búsqueda | `MagnifyingGlass` |
| Borrar campo, cerrar hoja | `X` |
| Estoy en un punto QR | `QrCode` |
| Sala | `Door` |
| Biblioteca | `Books` |
| Baño accesible | `Toilet` |
| Casino | `ForkKnife` |
| Edificio | `Buildings` |
| Ascensor | `Elevator` |
| Escalera | `Stairs` |
| Rampa | `TrendUp` (o un SVG propio de rampa: línea diagonal sobre una base) |
| Tramo techado | `Umbrella` |
| Barrera, alerta, error de campo | `Warning` |
| Bloqueado, sin ruta | `Prohibit` |
| Escuchar o leer en voz alta | `SpeakerHigh` |
| En vivo | `Broadcast` |
| Sin conexión | `WifiSlash` |
| Navegación: Ruta | `MapTrifold` |
| Navegación: Comparar | `ArrowsLeftRight` |
| Navegación: Reportar | `Flag` |
| Navegación: Acerca | `Info` |
| Botón Accesibilidad (móvil) | `PersonArmsSpread` |
| Alto contraste | `CircleHalf` |
| Mapa: acercar, alejar | `Plus`, `Minus` |
| Mapa: centrar | `Crosshair` |
