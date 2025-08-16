import numpy as np
import torch
import torch.nn.functional as F
from facenet_pytorch import MTCNN

from ekyc.common.distance import cosine_distance, euclidean_distance, l1_distance, find_threshold
from ekyc.common.functions import extract_face, face_transform, align_face, normalize_contrast
from ekyc.models import VGGFace2


class FaceVerifier:
    def __init__(self, model_name="VGG-Face2", distance_metric="euclidean", device=None):
        self.model_name = model_name
        self.distance_metric = distance_metric
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.detector = MTCNN(device=self.device)
        self.verifier = VGGFace2.load_model(device=self.device)

        self.distance_func = {
            "cosine": cosine_distance,
            "L1": l1_distance,
            "euclidean": euclidean_distance,
        }.get(distance_metric, euclidean_distance)

        self.threshold = find_threshold(model_name=self.model_name, distance_metric=self.distance_metric)

    def verify(self, img1: np.ndarray, img2: np.ndarray):
        face1, _, lm1 = extract_face(img1, self.detector, padding=1)
        face2, _, lm2 = extract_face(img2, self.detector, padding=1)

        if face1 is not None and face2 is not None:
            face1 = normalize_contrast(face1)
            face2 = normalize_contrast(face2)

            if lm1 is not None:
                face1 = align_face(face1, lm1)
            if lm2 is not None:
                face2 = align_face(face2, lm2)

            return self._face_matching(face1, face2)

        print("Không phát hiện đủ khuôn mặt từ ảnh.")
        return False

    def _face_matching(self, face1, face2):
        face1 = face_transform(face1, model_name=self.model_name, device=self.device)
        face2 = face_transform(face2, model_name=self.model_name, device=self.device)

        result1 = F.normalize(self.verifier(face1), p=2, dim=1)
        result2 = F.normalize(self.verifier(face2), p=2, dim=1)

        dis = self.distance_func(result1, result2)

        return dis < self.threshold
