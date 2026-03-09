<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Employees/Index', [
            'employees' => User::with('branch')->where('id', '!=', Auth::id())->latest()->get(),
            'branches'  => Branch::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8',
            'role'      => 'required|string|in:admin,cashier',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        return back()->with('success', 'Employee created successfully');
    }

    public function update(Request $request, User $employee)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users,email,' . $employee->id,
            'password'  => 'nullable|string|min:8',
            'role'      => 'required|string|in:admin,cashier',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $employee->update([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'role'      => $validated['role'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        if ($request->filled('password')) {
            $employee->update(['password' => Hash::make($validated['password'])]);
        }

        return back()->with('success', 'Employee updated successfully');
    }

    public function destroy(User $employee)
    {
        if ($employee->id === Auth::id()) {
            return back()->with('error', 'You cannot delete yourself');
        }

        $employee->delete();
        return back()->with('success', 'Employee deleted successfully');
    }
}
