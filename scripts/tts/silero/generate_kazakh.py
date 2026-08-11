import argparse
from array import array
from pathlib import Path
import urllib.request
import wave

import torch


MODELS = (
    (
        "v5_cis_base_nostress.pt",
        "https://models.silero.ai/models/tts/ru/v5_cis_base_nostress.pt",
        ("kaz_zhadyra", "kaz_zhazira"),
    ),
    (
        "v5_cis_ext.pt",
        "https://models.silero.ai/models/tts/ru/v5_cis_ext.pt",
        ("kaz_aidana", "kaz_aisha", "kaz_danara"),
    ),
)
TEXT = (
    "Ди төрт жүз жиырма сегіз нөмірлі қызмет алушы, сізді жақын арада шақырады. "
    "Күту аймағына өтіңіз."
)


def write_wav(output_path: Path, audio: torch.Tensor, sample_rate: int) -> None:
    samples = audio.detach().cpu().clamp(-1, 1).mul(32767).to(torch.int16).tolist()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(array("h", samples).tobytes())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default="/cache")
    parser.add_argument("--output", default="/work/client/public/audio/seo/silero-kazakh")
    args = parser.parse_args()

    torch.set_num_threads(4)
    cache_dir = Path(args.cache)
    cache_dir.mkdir(parents=True, exist_ok=True)
    sample_rate = 48000
    output_dir = Path(args.output)
    for model_name, model_url, speakers in MODELS:
        model_path = cache_dir / model_name
        if not model_path.exists():
            print(f"Downloading {model_url}", flush=True)
            urllib.request.urlretrieve(model_url, model_path)

        model = torch.package.PackageImporter(str(model_path)).load_pickle("tts_models", "model")
        model.to(torch.device("cpu"))
        for speaker in speakers:
            audio = model.apply_tts(text=TEXT, speaker=speaker, sample_rate=sample_rate)
            output_path = output_dir / f"{speaker}.raw.wav"
            write_wav(output_path, audio, sample_rate)
            print(f"Generated {output_path}", flush=True)


if __name__ == "__main__":
    main()
