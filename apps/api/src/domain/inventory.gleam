import gleam/option.{type Option}

pub type MovementType {
  InitialStock
  Purchase
  ManualAdjustment
  Correction
  Return
  Sale
}

pub fn movement_type_to_string(m_type: MovementType) -> String {
  case m_type {
    InitialStock -> "initial_stock"
    Purchase -> "purchase"
    ManualAdjustment -> "manual_adjustment"
    Correction -> "correction"
    Return -> "return"
    Sale -> "sale"
  }
}

pub fn string_to_movement_type(str: String) -> Result(MovementType, Nil) {
  case str {
    "initial_stock" -> Ok(InitialStock)
    "purchase" -> Ok(Purchase)
    "manual_adjustment" -> Ok(ManualAdjustment)
    "correction" -> Ok(Correction)
    "return" -> Ok(Return)
    "sale" -> Ok(Sale)
    _ -> Error(Nil)
  }
}

pub type InventoryMovement {
  InventoryMovement(
    id: String,
    product_id: String,
    delta: Int,
    movement_type: MovementType,
    reason: Option(String),
    reference_type: Option(String),
    reference_id: Option(String),
    admin_user_id: Option(String),
    created_at: String,
  )
}

pub fn calculate_new_stock(current_stock: Int, delta: Int) -> Result(Int, Nil) {
  let new_stock = current_stock + delta
  case new_stock >= 0 {
    True -> Ok(new_stock)
    False -> Error(Nil)
  }
}

pub type InventoryMovementInput {
  InventoryMovementInput(
    product_id: String,
    delta: Int,
    movement_type: MovementType,
    reason: Option(String),
    admin_user_id: Option(String),
  )
}

pub type InventoryFilters {
  InventoryFilters(
    product_id: Option(String),
    movement_type: Option(MovementType),
    page: Int,
    page_size: Int,
  )
}
