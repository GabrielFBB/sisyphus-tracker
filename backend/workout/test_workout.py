import pytest
from datetime import date, timedelta
from django.db import IntegrityError
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from workout.models import Workout, Exercise, WorkoutSession


@pytest.fixture
def user(db):
    return User.objects.create_user(username="gabriel", password="segredo123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="outra", password="segredo123")


@pytest.fixture
def client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.fixture
def treino(user):
    return Workout.objects.create(user=user, name="Peito e triceps", modality="strength", method="ppl")


class TestWorkoutSession:
    def test_nao_permite_duas_sessoes_no_mesmo_dia(self, treino):
        WorkoutSession.objects.create(workout=treino, date=date.today())
        with pytest.raises(IntegrityError):
            WorkoutSession.objects.create(workout=treino, date=date.today())

    def test_permite_o_mesmo_treino_em_dias_diferentes(self, treino):
        WorkoutSession.objects.create(workout=treino, date=date.today())
        WorkoutSession.objects.create(workout=treino, date=date.today() - timedelta(days=1))
        assert treino.sessions.count() == 2

    def test_treinos_diferentes_no_mesmo_dia(self, user):
        a = Workout.objects.create(user=user, name="Peito")
        b = Workout.objects.create(user=user, name="Pernas")
        WorkoutSession.objects.create(workout=a, date=date.today())
        WorkoutSession.objects.create(workout=b, date=date.today())
        assert WorkoutSession.objects.count() == 2

    def test_apagar_treino_apaga_as_sessoes(self, treino):
        WorkoutSession.objects.create(workout=treino, date=date.today())
        treino.delete()
        assert WorkoutSession.objects.count() == 0


class TestWorkoutIsolation:
    def test_lista_apenas_treinos_do_proprio(self, client, user, other_user):
        Workout.objects.create(user=user, name="Meu treino")
        Workout.objects.create(user=other_user, name="Treino alheio")
        res = client.get("/api/workouts/")
        assert res.status_code == 200
        assert [w["name"] for w in res.json()] == ["Meu treino"]

    def test_nao_ve_sessoes_de_outro(self, client, other_user):
        alheio = Workout.objects.create(user=other_user, name="Alheio")
        WorkoutSession.objects.create(workout=alheio, date=date.today())
        res = client.get("/api/sessions/")
        assert res.status_code == 200
        assert res.json() == []

    def test_nao_ve_exercicios_de_outro(self, client, other_user):
        alheio = Workout.objects.create(user=other_user, name="Alheio")
        Exercise.objects.create(workout=alheio, name="Supino", sets=3, reps=10, weight=100)
        res = client.get("/api/exercises/")
        assert res.status_code == 200
        assert res.json() == []


class TestWorkoutSerializer:
    def test_resposta_inclui_exercicios_e_sessoes(self, client, treino):
        Exercise.objects.create(workout=treino, name="Supino", sets=3, reps=10, weight=100)
        WorkoutSession.objects.create(workout=treino, date=date.today())
        res = client.get("/api/workouts/")
        data = res.json()[0]
        assert len(data["exercises"]) == 1
        assert data["exercises"][0]["name"] == "Supino"
        assert len(data["sessions"]) == 1

    def test_exercicio_sem_carga_e_valido(self, treino):
        ex = Exercise.objects.create(workout=treino, name="Flexoes", sets=4, reps=15)
        assert ex.weight is None


class TestWorkoutAuth:
    def test_sem_token_recusa(self, db):
        assert APIClient().get("/api/workouts/").status_code == 401
        assert APIClient().get("/api/sessions/").status_code == 401
