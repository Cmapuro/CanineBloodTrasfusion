<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ClinicScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user === null || $user->role === 'gov_admin') {
            return;
        }

        $clinicColumn = $model->getTable() === 'emergency_requests'
            ? 'requesting_clinic_id'
            : 'registered_clinic_id';

        if ($user->clinic_id !== null) {
            $builder->where($model->getTable() . '.' . $clinicColumn, $user->clinic_id);
        }
    }
}
