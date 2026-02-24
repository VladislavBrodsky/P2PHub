
import unittest
from unittest.mock import MagicMock

# Define format_partner_name locally for testing
def format_partner_name(p_name):
    return f"{p_name}_name"

def test_chain_logic(referrer_id, full_lineage_ids, full_lineage_names, new_partner_name):
    try:
        ref_idx = full_lineage_ids.index(referrer_id)
        children_names = full_lineage_names[ref_idx + 1:]
        msg_chain = ["You", *children_names]
    except (ValueError, IndexError):
        msg_chain = ["You"]
    
    chain_text = " ← ".join([*msg_chain, new_partner_name])
    return chain_text

class TestReferralChain(unittest.TestCase):
    def test_l4_chain(self):
        # Setup data matching the USLINCOLN case
        # USLINCOLN (1) -> Rudskixx (6) -> Denis (367) -> Gunnetwork (369) -> Alexander (383)
        full_lineage_ids = [1, 6, 367, 369]
        full_lineage_names = ["USLINCOLN_name", "Rudskixx_name", "Denis_name", "Gunnetwork_name"]
        new_partner_name = "Alexander_name"
        
        # Test for USLINCOLN (ID 1)
        # Expected: You (1) <- Rudskixx (6) <- Denis (367) <- Gunnetwork (369) <- Alexander (383)
        result = test_chain_logic(1, full_lineage_ids, full_lineage_names, new_partner_name)
        expected = "You ← Rudskixx_name ← Denis_name ← Gunnetwork_name ← Alexander_name"
        self.assertEqual(result, expected)
        
    def test_l2_chain(self):
        # Test for Denis (ID 367)
        # Expected: You (367) <- Gunnetwork (369) <- Alexander (383)
        full_lineage_ids = [1, 6, 367, 369]
        full_lineage_names = ["USLINCOLN_name", "Rudskixx_name", "Denis_name", "Gunnetwork_name"]
        new_partner_name = "Alexander_name"
        
        result = test_chain_logic(367, full_lineage_ids, full_lineage_names, new_partner_name)
        expected = "You ← Gunnetwork_name ← Alexander_name"
        self.assertEqual(result, expected)

    def test_l1_chain(self):
        # Test for Gunnetwork (ID 369)
        # Expected: You (369) <- Alexander (383)
        full_lineage_ids = [1, 6, 367, 369]
        full_lineage_names = ["USLINCOLN_name", "Rudskixx_name", "Denis_name", "Gunnetwork_name"]
        new_partner_name = "Alexander_name"
        
        result = test_chain_logic(369, full_lineage_ids, full_lineage_names, new_partner_name)
        expected = "You ← Alexander_name"
        self.assertEqual(result, expected)

if __name__ == "__main__":
    unittest.main()
