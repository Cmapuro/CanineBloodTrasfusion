<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## CanineLink emergency donor locations

Donor coordinates are encrypted before storage in `donor_locations`. Clinic map endpoints return donor coordinates only for the clinic's own accepted, active emergency requests when the owner has explicitly granted temporary sharing. The general nearby-clinics endpoint never returns donor locations. Approximate distances are calculated only when a recent location is available and the owner has opted into distance estimates; travel time is `unavailable` unless a routing provider is configured (none is configured by default).

The owner location-sharing page controls the optional distance-estimate consent and encrypted location update. Emergency request acceptance is separate from temporary location permission; owners can deny or revoke that permission at any time. Temporary access expires after `CANINELINK_TEMPORARY_LOCATION_HOURS`; stale locations older than `CANINELINK_LOCATION_MAX_AGE_MINUTES` are never returned. `CANINELINK_RESPONSE_WINDOW_MINUTES` controls how long each relayed donor has to respond. An optional veterinarian-approved donor weight threshold can be set with `CANINELINK_MINIMUM_DONOR_WEIGHT_KG`; no medical threshold is assumed when it is unset.

### API endpoints

- `GET /api/clinic/matches` — clinic staff only; returns the clinic's emergency donor matches and only currently authorized coordinates.
- `PUT /api/donor/dogs/{dogId}/location-sharing` — dog owner only; grants or revokes approximate-distance consent.
- `PUT /api/donor/dogs/{dogId}/location` — dog owner only; saves an encrypted current location when approximate-distance consent is enabled.
- `GET /api/donor/matches` — dog owner only; returns that owner's emergency requests and permission statuses.
- `POST /api/matches/{match}/respond` — the matched owner accepts or declines.
- `PUT /api/matches/{match}/location-sharing` — the matched owner grants, denies, or revokes request-specific temporary access.
- `POST /api/emergency-requests/{emergencyRequest}/cancel` — requesting clinic staff only; cancels and ends location access.
- `POST /api/emergency-requests/{emergencyRequest}/complete` — requesting clinic staff only; records the donation and ends location access.

### Run and test

From the repository root, run `npm install` and `npm run dev` for React. In `backend`, run `composer install` if needed, `php artisan migrate`, then `php artisan serve`. Run `php artisan schedule:work` in a separate backend terminal so response timeouts relay to the next donor and expired temporary locations are cleaned up automatically. In production, configure Laravel's scheduler to run `schedule:run` every minute.

Run the focused backend privacy and relay tests with `php artisan test --filter=EmergencyLocationSharingTest` and `php artisan test --filter=NearbyLocationsTest`. Configure `APP_KEY` before accepting location updates; it is used to encrypt and decrypt coordinates.
