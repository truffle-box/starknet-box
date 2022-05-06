# Declare this file as a StarkNet contract.
%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin

@event
func BalanceIncreased(value : felt):
end

# Define a storage variable.
@storage_var
func balance() -> (res : felt):
end

@constructor
func constructor{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}(initial_balance : felt):
    balance.write(value=initial_balance)
    return()
end

# Increases the balance by the given amount.
@external
func increase_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}(amount : felt):
    let (res) = balance.read()
    balance.write(res + amount)
    BalanceIncreased.emit(amount)
    return ()
end

# Returns the current balance.
@view
func get_balance{
        syscall_ptr : felt*, pedersen_ptr : HashBuiltin*,
        range_check_ptr}() -> (res : felt):
    let (res) = balance.read()
    return (res)
end
