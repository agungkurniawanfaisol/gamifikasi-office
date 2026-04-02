<?php

it('renders the welcome page', function () {
    $response = $this->get('/');

    $response->assertOk();
});
