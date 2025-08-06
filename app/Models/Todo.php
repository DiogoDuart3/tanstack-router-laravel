<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Todo extends Model
{
    use HasFactory;
    protected $fillable = [
        'title',
        'description',
        'completed',
        'user_id',
        'images',
        'primary_image',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'images' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getImageUrlsAttribute(): array
    {
        if (!$this->images) {
            return [];
        }

        return array_map(function ($imagePath) {
            return asset('storage/' . $imagePath);
        }, $this->images);
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        if (!$this->primary_image) {
            return null;
        }

        return asset('storage/' . $this->primary_image);
    }

    public function addImage(string $imagePath, bool $isPrimary = false): void
    {
        $images = $this->images ?? [];
        $images[] = $imagePath;
        $this->images = $images;

        if ($isPrimary || !$this->primary_image) {
            $this->primary_image = $imagePath;
        }
    }

    public function removeImage(string $imagePath): void
    {
        $images = $this->images ?? [];
        $images = array_filter($images, fn($path) => $path !== $imagePath);
        $this->images = array_values($images);

        if ($this->primary_image === $imagePath) {
            $this->primary_image = !empty($images) ? $images[0] : null;
        }
    }
}
