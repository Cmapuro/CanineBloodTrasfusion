<?php

namespace App\Policies;

use App\Models\Dog;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DogPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['gov_admin', 'clinic_admin', 'clinic_staff', 'dog_owner'], true);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Dog $dog): bool
    {
        return $user->role === 'gov_admin'
            || $dog->owner_user_id === $user->user_id
            || $dog->registered_clinic_id === $user->clinic_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === 'dog_owner';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Dog $dog): bool
    {
        return $user->role === 'gov_admin' || $dog->owner_user_id === $user->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Dog $dog): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Dog $dog): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Dog $dog): bool
    {
        return false;
    }
}
