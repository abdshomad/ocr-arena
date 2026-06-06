import sys
import collections

# Patch collections for Python 3.10+ compat
if not hasattr(collections, 'MutableMapping'):
    import collections.abc
    collections.MutableMapping = collections.abc.MutableMapping
if not hasattr(collections, 'Mapping'):
    import collections.abc
    collections.Mapping = collections.abc.Mapping
if not hasattr(collections, 'Sequence'):
    import collections.abc
    collections.Sequence = collections.abc.Sequence

# Patch LlamaTokenizer / PreTrainedTokenizerBase to avoid AttributeError on newer transformers
import transformers
if hasattr(transformers, 'tokenization_utils_base'):
    tb = transformers.tokenization_utils_base
    if not hasattr(tb.PreTrainedTokenizerBase, 'all_special_tokens_extended'):
        tb.PreTrainedTokenizerBase.all_special_tokens_extended = property(lambda self: self.all_special_tokens)
    if not hasattr(tb.PreTrainedTokenizerBase, 'special_tokens_map_extended'):
        tb.PreTrainedTokenizerBase.special_tokens_map_extended = property(lambda self: self.special_tokens_map)

# Run console entry
from paddleocr.__main__ import console_entry
if __name__ == "__main__":
    sys.exit(console_entry())
