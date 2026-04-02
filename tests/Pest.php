<?php

use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature tests use the Laravel application TestCase. Unit Pest files use
| PHPUnit\Framework\TestCase for fast, framework-free assertions.
|
*/

uses(TestCase::class)->in('Feature');

uses(PHPUnit\Framework\TestCase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
