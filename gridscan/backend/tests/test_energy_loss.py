from app.services.energy_loss import calculate_energy_loss


def test_energy_loss_matches_notebook_formulas():
    """
    Hand-calculated check using the notebook's exact constants
    (CURRENT=250A, R_PER_KM=0.15 ohm/km) against one real row from the
    notebook's consolidated table: span "2-3 U" with
    Actual_Cable_Length=24.15, Pole_Span=24.04.
    """
    result = calculate_energy_loss(
        wire_length_m=24.15,
        pole_distance_m=24.04,
        current_sag_m=1.17,
        current_amps=250.0,
        resistance_per_km_ohm=0.15,
        initial_sag_m=0.09,
    )

    expected_expansion = 24.15 - 24.04  # 0.11
    expected_resistance = 0.15 * expected_expansion / 1000
    expected_power = (250.0 ** 2) * expected_resistance
    expected_energy = expected_power * 24 * 365 / 1000

    assert abs(result.cable_expansion_m - expected_expansion) < 1e-9
    assert abs(result.extra_resistance_ohm - expected_resistance) < 1e-12
    assert abs(result.extra_power_loss_w - expected_power) < 1e-9
    assert abs(result.annual_energy_loss_kwh - expected_energy) < 1e-9


def test_zero_expansion_means_zero_loss():
    result = calculate_energy_loss(
        wire_length_m=20.0, pole_distance_m=20.0, current_sag_m=0.5,
        current_amps=250.0, resistance_per_km_ohm=0.15, initial_sag_m=0.09,
    )
    assert result.cable_expansion_m == 0.0
    assert result.extra_power_loss_w == 0.0
    assert result.annual_energy_loss_kwh == 0.0


def test_params_are_configurable_not_hardcoded():
    """Changing current/resistance must change the result — proves no hardcoded constants."""
    r1 = calculate_energy_loss(24.15, 24.04, 1.17, current_amps=250.0,
                                resistance_per_km_ohm=0.15, initial_sag_m=0.09)
    r2 = calculate_energy_loss(24.15, 24.04, 1.17, current_amps=400.0,
                                resistance_per_km_ohm=0.30, initial_sag_m=0.09)
    assert r1.extra_power_loss_w != r2.extra_power_loss_w
    assert r1.annual_energy_loss_kwh != r2.annual_energy_loss_kwh
