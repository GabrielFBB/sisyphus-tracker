import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from habits.models import Habit, HabitLog


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


class TestHabitLogCompleted:
    def test_binario_atinge_meta_com_valor_um(self, user):
        habit = Habit.objects.create(user=user, name="Meditar", habit_type="binary", target=1)
        log = HabitLog.objects.create(habit=habit, date=date.today(), value=1)
        assert log.completed is True

    def test_quantidade_abaixo_da_meta_nao_conta(self, user):
        habit = Habit.objects.create(user=user, name="Agua", habit_type="quantity", target=5)
        log = HabitLog.objects.create(habit=habit, date=date.today(), value=2.5)
        assert log.completed is False

    def test_quantidade_acima_da_meta_conta(self, user):
        habit = Habit.objects.create(user=user, name="Agua", habit_type="quantity", target=5)
        log = HabitLog.objects.create(habit=habit, date=date.today(), value=6)
        assert log.completed is True

    def test_target_zero_trata_como_um(self, user):
        """A base de dados aceita target zero. O save nao deve dividir por zero
        nem marcar como incompleto um habito que foi feito."""
        habit = Habit.objects.create(user=user, name="Estranho", habit_type="binary", target=0)
        log = HabitLog.objects.create(habit=habit, date=date.today(), value=1)
        assert log.completed is True

    def test_completed_recalcula_ao_atualizar(self, user):
        habit = Habit.objects.create(user=user, name="Correr", habit_type="duration", target=30)
        log = HabitLog.objects.create(habit=habit, date=date.today(), value=10)
        assert log.completed is False
        log.value = 35
        log.save()
        assert log.completed is True


class TestHabitIsolation:
    def test_lista_apenas_habitos_do_proprio(self, client, user, other_user):
        Habit.objects.create(user=user, name="Meu habito")
        Habit.objects.create(user=other_user, name="Habito alheio")
        res = client.get("/api/habits/")
        assert res.status_code == 200
        nomes = [h["name"] for h in res.json()]
        assert nomes == ["Meu habito"]

    def test_nao_acede_a_habito_de_outro(self, client, other_user):
        alheio = Habit.objects.create(user=other_user, name="Habito alheio")
        res = client.get(f"/api/habits/{alheio.id}/")
        assert res.status_code == 404

    def test_criar_atribui_o_utilizador_autenticado(self, client, user):
        res = client.post("/api/habits/", {"name": "Novo", "habit_type": "binary", "target": 1}, format="json")
        assert res.status_code == 201
        assert Habit.objects.get(id=res.json()["id"]).user == user


class TestHabitAuth:
    def test_listar_sem_token_recusa(self, db):
        res = APIClient().get("/api/habits/")
        assert res.status_code == 401

    def test_criar_sem_token_recusa(self, db):
        res = APIClient().post("/api/habits/", {"name": "X"}, format="json")
        assert res.status_code == 401
