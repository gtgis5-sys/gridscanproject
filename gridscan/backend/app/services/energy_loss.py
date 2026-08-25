"""
Energy loss calculations.

Exact formulas from the notebook's final consolidated section:

    Cable_Expansion   = Wire_Length - Pole_Distance
    Expansion_%       = Cable_Expansion / Pole_Distance * 100
    Additional_Sag    = Current_Sag - Initial_Sag
    Extra_Resistance  = R_PER_KM * Cable_Expansion / 1000      (ohms)
    Extra_Power_Loss  = CURRENT^2 * Extra_Resistance            (watts)
    Annual_Energy     = Extra_Power_Loss * 24 * 365 / 1000      (kWh/year)

All four constants (CURRENT, R_PER_KM, INITIAL_SAG) are parameters, not
hardcoded — they come from AnalysisParams on every request.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class EnergyLossResult:
    cable_expansion_m: float
    expansion_pct: float
    additional_sag_m: float
    extra_resistance_ohm: float
    extra_power_loss_w: float
    annual_energy_loss_kwh: float


def calculate_energy_loss(
    wire_length_m: float,
    pole_distance_m: float,
    current_sag_m: float,
    current_amps: float,
    resistance_per_km_ohm: float,
    initial_sag_m: float,
) -> EnergyLossResult:
    """Compute the full expansion -> resistance -> power loss -> annual energy chain for one conductor."""
    cable_expansion = wire_length_m - pole_distance_m

    expansion_pct = (cable_expansion / pole_distance_m * 100) if pole_distance_m > 0 else 0.0

    additional_sag = current_sag_m - initial_sag_m

    extra_resistance = resistance_per_km_ohm * cable_expansion / 1000
    extra_power_loss = (current_amps ** 2) * extra_resistance
    annual_energy_loss = extra_power_loss * 24 * 365 / 1000

    return EnergyLossResult(
        cable_expansion_m=cable_expansion,
        expansion_pct=expansion_pct,
        additional_sag_m=additional_sag,
        extra_resistance_ohm=extra_resistance,
        extra_power_loss_w=extra_power_loss,
        annual_energy_loss_kwh=annual_energy_loss,
    )
