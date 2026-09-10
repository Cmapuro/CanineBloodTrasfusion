<?php

namespace App\Policies;

use App\Models\EmergencyRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EmergencyRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['gov_admin', 'clinic_admin', 'clinic_staff'], true);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, EmergencyRequest $emergencyRequest): bool
    {
        return $user->role === 'gov_admin' || $emergencyRequest->requesting_clinic_id === $user->clinic_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, EmergencyRequest $emergencyRequest): bool
    {
        return $this->view($user, $emergencyRequest);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, EmergencyRequest $emergencyRequest): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, EmergencyRequest $emergencyRequest): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, EmergencyRequest $emergencyRequest): bool
    {
        return false;
    }
}
