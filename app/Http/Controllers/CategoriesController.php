<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();

        // Determine branch filter
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id');
        } else {
            $branchId = $user->branch_id;
        }

        $query = Category::query()->withCount('products');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->orderBy('name')->get()->map(function ($category) {
            $category->image_url = $category->image_path
                ? Storage::disk('public')->url($category->image_path)
                : null;
            return $category;
        });

        return Inertia::render('Categories/Index', [
            'categories'      => $categories,
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'summary'         => [
                'total_categories' => $categories->count(),
            ],
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'branch_id'   => 'nullable|exists:branches,id',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
        }

        $branchId = $user->isAdmin()
            ? ($validated['branch_id'] ?? $user->branch_id)
            : $user->branch_id;

        Category::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path'  => $imagePath,
            'branch_id'   => $branchId,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
        ]);

        $imagePath = $category->image_path;

        if ($request->hasFile('image')) {
            if ($category->image_path) {
                Storage::disk('public')->delete($category->image_path);
            }
            $imagePath = $request->file('image')->store('categories', 'public');
        }

        $category->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path'  => $imagePath,
        ]);

        return redirect()->back();
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }

        $category->delete();

        return redirect()->back();
    }
}
