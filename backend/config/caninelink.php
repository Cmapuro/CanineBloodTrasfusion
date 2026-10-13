<?php

return [
    'response_window_minutes' => (int) env('CANINELINK_RESPONSE_WINDOW_MINUTES', 15),
    'temporary_location_hours' => (int) env('CANINELINK_TEMPORARY_LOCATION_HOURS', 2),
    'location_max_age_minutes' => (int) env('CANINELINK_LOCATION_MAX_AGE_MINUTES', 30),
    'minimum_donor_weight_kg' => env('CANINELINK_MINIMUM_DONOR_WEIGHT_KG') !== null
        ? (float) env('CANINELINK_MINIMUM_DONOR_WEIGHT_KG')
        : null,
];
