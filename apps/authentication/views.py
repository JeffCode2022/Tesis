from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, LoginSerializer, UserSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    print("Headers recibidos:", request.headers)
    print("Datos recibidos:", request.data)
    
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        print("Errores de validación:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    
    # Serializar el usuario para depuración
    user_data = UserSerializer(user).data
    print(f"DEBUG: User data being sent from login_view: {user_data}")

    response = Response({
        'user': user_data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })
    
    # Configurar headers de CORS
    response["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    
    return response

@api_view(['POST'])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"ERROR en logout_view: {e}")
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
