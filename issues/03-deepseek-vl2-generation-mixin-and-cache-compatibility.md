# Issue 03: DeepSeek-VL2 Generation call failure on modern Transformers

## Problem
When invoking layout-parsing via the `deepseek-vl2` engine, the server encountered the following errors:
1. `AttributeError: 'DeepseekVLV2ForCausalLM' object has no attribute 'language_model'` in `serve.py` when attempting to call `m.language_model.generate(...)`.
2. After replacing `.language_model` with `.language`, it threw `TypeError: 'DeepseekV2ForCausalLM' has no attribute 'generate'` because newer `transformers` versions (from 4.50+ onwards) do not automatically inherit `GenerationMixin` for models that trust remote code.
3. After dynamically adding `GenerationMixin` to the base classes of the model, it failed during the prefill phase with:
   `RuntimeError: cannot reshape tensor of 0 elements into shape [1, 0, -1, 128] because the unspecified dimension size -1 can be any value and is ambiguous`
   This occurred because `transformers.generate()` now eagerly initializes `past_key_values` with a `DynamicCache` object, causing `prepare_inputs_for_generation()` to check `past_key_values is not None`, evaluate to `False`, and discard the `inputs_embeds` in favor of a dummy `input_ids` tensor of shape `(batch, 0)`.

## Context
- **Environment**: Docker container `ocr-engine-deepseek-vl2` running Python 3.12, torch 2.4, and transformers 4.45+.
- **Model**: `deepseek-ai/deepseek-vl2-tiny`

## Solution
We implemented dynamic monkey patches directly in `ocr-engines/deepseek-vl2/serve.py`:
1. Changed `m.language_model.generate` to `m.language.generate`.
2. Dynamically injected `GenerationMixin` into `DeepseekV2ForCausalLM.__bases__` and `DeepseekVLV2ForCausalLM.__bases__` to restore the `generate` function capability:
   ```python
   from transformers.generation.utils import GenerationMixin
   from deepseek_vl2.models.modeling_deepseek import DeepseekV2ForCausalLM
   if GenerationMixin not in DeepseekV2ForCausalLM.__bases__:
       DeepseekV2ForCausalLM.__bases__ = DeepseekV2ForCausalLM.__bases__ + (GenerationMixin,)
   if GenerationMixin not in DeepseekVLV2ForCausalLM.__bases__:
       DeepseekVLV2ForCausalLM.__bases__ = DeepseekVLV2ForCausalLM.__bases__ + (GenerationMixin,)
   ```
3. Wrapped `prepare_inputs_for_generation` to properly restore the visual model's `inputs_embeds` during prefill when an eagerly initialized empty cache is present:
   ```python
   original_prepare = DeepseekV2ForCausalLM.prepare_inputs_for_generation

   def patched_prepare(self, input_ids, past_key_values=None, attention_mask=None, inputs_embeds=None, **kwargs):
       model_inputs = original_prepare(self, input_ids, past_key_values=past_key_values, attention_mask=attention_mask, inputs_embeds=inputs_embeds, **kwargs)
       if inputs_embeds is not None and past_key_values is not None:
           is_empty = False
           if hasattr(past_key_values, "get_seq_length") and past_key_values.get_seq_length() == 0:
               is_empty = True
           elif not hasattr(past_key_values, "get_seq_length") and len(past_key_values) == 0:
               is_empty = True
               
           if is_empty:
               model_inputs["inputs_embeds"] = inputs_embeds
               if "input_ids" in model_inputs:
                   del model_inputs["input_ids"]
       return model_inputs

   DeepseekV2ForCausalLM.prepare_inputs_for_generation = patched_prepare
   ```

## References
- `ocr-engines/deepseek-vl2/serve.py`
- `scratch/verify_endpoints.py`
- `AGENTS.md`
