<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Branch::orderBy('name')->get());
    }
}
