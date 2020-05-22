pragma solidity 0.5.2;

library SafeMath {
//attention asser vide es gas require retourne
  int256 constant INT256_MIN = -((2**256)/2);
  int256 constant INT256_MAX = ((2**256)/2)-1;

  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);//, "math error : mul overflow");
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b > 0);//, "math error : division by 0");
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);//, "math error : sub underflow");
    uint256 c = a - b;
    return c;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);//, "math error : add overflow");
    return c;
  }

  function uintToInt(uint256 a) internal pure returns (int256) {
    assert(a <= uint256(INT256_MAX));//, "casting error : uint to int overflow");
    int256 c = int256(a);
    return c;
  }

  function mul(int256 a, int256 b) internal pure returns (int256) {
      // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
      // benefit is lost if 'b' is also tested.
      // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
      if (a == 0) {
          return 0;
      }
      require(!(a == -1 && b == INT256_MIN), "math error: int mult overflow");
      int256 c = a * b;
      assert(c / a == b);//, "math error: int mult overflow");

      return c;
  }

  function div(int256 a, int256 b) internal pure returns (int256) {
      require(b != 0, "math error : int division by zero");
      require(!(b == -1 && a == INT256_MIN));//, "math error: int div overflow");

      int256 c = a / b;

      return c;
  }

  /**
   * @dev Subtracts two signed integers, reverts on overflow.
   */
  function sub(int256 a, int256 b) internal pure returns (int256) {
      int256 c = a - b;
      require((b >= 0 && c <= a) || (b < 0 && c > a));//, "SignedSafeMath: subtraction overflow");

      return c;
  }

  /**
   * @dev Adds two signed integers, reverts on overflow.
   */
  function add(int256 a, int256 b) internal pure returns (int256) {
      int256 c = a + b;
      require((b >= 0 && c >= a) || (b < 0 && c < a));//, "SignedSafeMath: addition overflow");

      return c;
  }
}
